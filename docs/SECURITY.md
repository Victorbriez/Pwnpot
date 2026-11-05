# Sécurité et limites connues

Ce document liste ce qu'un attaquant peut tenter contre Pwnpot, ce qui l'en empêche, et ce qui reste possible. Il complète le tableau des rôles du [README](../README.md#rôles-et-confiance) et la liste des problématiques de [DESIGN.md](DESIGN.md#problématiques-et-réponses).

## Sommaire

1. [Principes appliqués partout](#principes-appliqués-partout)
2. [Modèle de menace, par attaquant](#modèle-de-menace-par-attaquant)
3. [Invariants](#invariants)
4. [Limites connues et assumées](#limites-connues-et-assumées)
5. [Processus de vérification](#processus-de-vérification)

---

## Principes appliqués partout

| Principe | Application dans `CTFPlatform` |
| --- | --- |
| **Aucun pouvoir admin** | Pas d'`Ownable`, pas de proxy, pas de `pause`. L'arbitre est `immutable`. |
| **Pull payment** | Chaque issue crédite `owed[address]`. Seul `withdraw()` envoie de l'ETH, à l'appelant. |
| **Checks-effects-interactions** | Vérifications, puis mise à jour de l'état, puis appel externe en dernier. |
| **`nonReentrant`** | Sur toute fonction qui envoie de l'ETH ou appelle une factory. |
| **Code tiers isolé** | `validateInstance` est appelé en `staticcall` avec une limite de gaz. Un revert ou un résultat mal formé compte comme « non résolu ». |
| **Pas de boucle sur les joueurs** | `maxPlayers` borné, classement mis à jour à chaque `submit`, remboursements en pull. |
| **Comptabilité interne** | Jamais de logique basée sur `address(this).balance`, qui peut être gonflé de force. |
| **Erreurs personnalisées + un event par étape** | Les refus sont lisibles par le frontend, chaque transition est traçable. |

---

## Modèle de menace, par attaquant

### Organisateur malveillant

| Attaque | Parade | Reste possible ? |
| --- | --- | --- |
| Partir avec la cagnotte | Fonds détenus par le contrat, aucune fonction de retrait arbitraire | Non |
| Annuler le CTF après les inscriptions | Aucune fonction d'annulation après l'ouverture | Non |
| Publier une épreuve impossible pour garder les tickets | Aucune réussite = tickets remboursés | Il récupère seulement sa mise de départ |
| Factory truquée (validation refusée à certains joueurs, porte dérobée) | Code vérifié et auditable avant paiement, `codehash` enregistré, litige | Oui, contre les joueurs qui ne lisent pas le code ; c'est contestable |
| Fuiter la solution à un complice | Caution brûlée si la triche est reconnue en litige | **Oui** : ce n'est pas prouvable on-chain (voir les limites) |
| Inscrire des complices pour bloquer un vote | Un ticket par adresse, prix minimum de 0.0001 ETH : chaque voix coûte un ticket. Appel à l'arbitre | Il paie les tickets, et l'appel le contourne |
| Laisser sa factory à sec pour bloquer les nouveaux joueurs | `createInstance` revert proprement | Oui, mais c'est contestable par litige |

### Joueur malveillant

| Attaque | Parade | Reste possible ? |
| --- | --- | --- |
| Valider sans avoir exploité | `validateInstance` lit l'état réel de **son** instance | Non |
| Soumettre l'instance d'un autre, ou le front-runner | Seule l'instance de `msg.sender` est validée | Non |
| Saboter l'instance d'un autre | Chaque instance est indépendante. Toucher l'instance d'un autre ne change rien pour soi | Non |
| Copier l'exploit d'un autre | Rien : la chaîne est publique | **Oui**, mais il arrive plus tard au classement |
| Réentrance sur `withdraw` | Solde remis à zéro avant le `call`, `nonReentrant` | Non |
| Contester par frustration | Caution de contestation perdue, versée à l'organisateur | Coûteux |
| Plusieurs comptes pour peser dans le vote | Un ticket par adresse, au moins 0.0001 ETH chacun. Appel à l'arbitre | Coûteux, et corrigé par l'appel |

### Factory malveillante (code tiers appelé par la plateforme)

| Attaque | Parade |
| --- | --- |
| Rappeler `CTFPlatform` pendant `createInstance` (réentrance) | `nonReentrant`, état mis à jour avant l'appel |
| Consommer tout le gaz dans `validateInstance` | `staticcall` avec limite de gaz explicite |
| Modifier un état pendant la validation | `staticcall` : toute écriture fait revert |
| Revert systématique | Seule cette épreuve est bloquée, les fonds et les autres épreuves continuent |
| Renvoyer des données mal formées | Décodage défensif : tout ce qui n'est pas exactement `true` compte comme « non résolu » |

### Arbitre

| Attaque | Parade | Reste possible ? |
| --- | --- | --- |
| Rendre une décision injuste | Il n'est saisi qu'en appel, et sa décision ne porte que sur les fonds du litige | **Oui**, dans ce périmètre |
| Ne jamais répondre | Timeout : le vote s'applique | Non |
| Appeler `rule` pour un autre CTF | `rule` vérifie `msg.sender == arbitrator` et la correspondance `disputeID → ctfId` | Non |

### Séquenceur Base, RPC, frontend

| Risque | Parade |
| --- | --- |
| Ordre des transactions décidé par le séquenceur | Aucune logique ne dépend d'être « le premier dans le bloc » en dehors du classement, qui se départage à la seconde |
| Décalage de `block.timestamp` de quelques secondes | Les deadlines se comptent en heures |
| RPC qui renvoie un état périmé après une écriture | Le frontend relit plusieurs fois avant d'afficher |
| Frontend compromis ou hors ligne | Il ne détient ni état ni clé. Tout reste faisable depuis Basescan (*Write Contract*) |

---

## Invariants

Ces propriétés doivent être vraies à tout moment. Ce sont les cibles des tests d'invariants (fuzzing Foundry).

1. **Solvabilité** : `address(this).balance ≥ Σ owed[*] + Σ fonds encore bloqués dans les CTF en cours`.
2. **Conservation** : pour un CTF finalisé, `cash prize + Σ tickets + caution organisateur + caution de contestation = Σ crédits distribués + montant brûlé`.
3. **Une seule issue** : un CTF finalisé ne peut plus changer d'issue, et ses fonds ne sont crédités qu'une fois.
4. **Pas de réussite sans exploit** : `LevelSolved(ctf, level, player)` implique que `validateInstance(instance(player), player)` renvoyait `true` au moment de la soumission.
5. **Pas d'admin** : aucune fonction ne permet à une adresse fixe (déployeur compris) de déplacer des fonds ou de changer une règle.
6. **Retrait borné** : `withdraw` ne peut jamais envoyer plus que `owed[msg.sender]`, et remet cette valeur à zéro.

---

## Limites connues et assumées

- **La fuite de solution n'est pas prouvable.** Un organisateur qui donne la solution à un complice avant le CTF ne laisse aucune trace on-chain. Le design la rend **coûteuse** (caution) et **contestable** (litige), mais pas impossible.
- **Le vote des joueurs n'est pas neutre.** Les perdants ont intérêt à voter « triche ». L'appel corrige ce biais : un organisateur honnête doit avancer les frais d'arbitrage, qui lui sont remboursés s'il gagne (plafonnés à la caution de contestation).
- **L'arbitre est trusted en appel.** Il est choisi au déploiement : c'est le seul choix du déployeur qui pèse sur les litiges. En démo, `MockArbitrator` est contrôlé par l'équipe. Il faut le dire explicitement au jury.
- **Les factories sont du code tiers.** La plateforme isole leur exécution, mais ne peut pas juger si une épreuve est « honnête ». C'est au joueur de lire le code vérifié.
- **Un exploit est copiable** une fois publié sur la chaîne. Le classement au temps limite l'intérêt de copier.
- **Le podium réduit l'intérêt de copier, mais ne le supprime pas.** Un copieur rapide peut finir 2e ou 3e et toucher une part de la cagnotte.
- **Le gas n'est pas remboursé** en cas de triche confirmée. Les joueurs récupèrent leur ticket, pas le gas dépensé.

---

## Processus de vérification

Avant chaque déploiement sur Base Sepolia :

- [ ] `pnpm contracts:test` passe, avec un test d'exploit par épreuve et un test par issue (gagnant, aucun gagnant, litige rejeté, triche confirmée, timeout de l'arbitre).
- [ ] `pnpm --filter @pwnpot/contracts exec hardhat test --build-profile production` passe.
- [ ] Slither lancé (`pipx install slither-analyzer`) : chaque alerte est corrigée, ou écartée avec une justification écrite ici.
- [ ] Liste des points d'entrée qui modifient l'état revue après chaque changement de `CTFPlatform` (plugin `entry-point-analyzer`).
- [ ] Aucune clé, seed ni `.env` dans git.

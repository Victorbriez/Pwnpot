# Sécurité et limites connues

Ce document liste ce qu'un attaquant peut tenter contre Pwnpot, ce qui l'en empêche, et ce qui reste possible. Il complète le tableau des rôles du [README](../README.md#rôles-et-confiance) et la liste des problématiques de [DESIGN.md](DESIGN.md#problématiques-et-réponses).

## Sommaire

1. [Principes appliqués partout](#principes-appliqués-partout)
2. [Modèle de menace, par attaquant](#modèle-de-menace-par-attaquant)
3. [Invariants](#invariants)
4. [Limites connues et assumées](#limites-connues-et-assumées)
5. [Passe de sécurité avant déploiement](#passe-de-sécurité-avant-déploiement)
6. [Processus de vérification](#processus-de-vérification)

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
| _(Design complet)_ Inscrire des complices pour bloquer un vote | Un ticket par adresse, prix minimum de 0.0001 ETH : chaque voix coûte un ticket. Appel à l'arbitre | Il paie les tickets, et l'appel le contourne |
| Faire ouvrir le litige par un complice, pour prendre la seule place avant un vrai joueur | Un seul litige par CTF, mais l'arbitre tranche sur les faits, pas sur la personne qui conteste. Un joueur honnête peut lui signaler la triche hors chaîne | **Oui** : si le litige est rejeté, la caution du complice revient à l'organisateur. La manœuvre ne coûte qu'un ticket et les frais d'arbitrage (0.0005 ETH), et retarde les gains jusqu'à 7 jours. Le contrat ne transmet aucune preuve à l'arbitre |
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
| _(Design complet)_ Plusieurs comptes pour peser dans le vote | Un ticket par adresse, au moins 0.0001 ETH chacun. Appel à l'arbitre | Coûteux, et corrigé par l'appel |

### Factory malveillante (code tiers appelé par la plateforme)

| Attaque | Parade |
| --- | --- |
| Rappeler `CTFPlatform` pendant `createInstance` (réentrance) | `nonReentrant` sur toutes les fonctions qui modifient l'état. L'adresse de l'instance n'est connue qu'après l'appel : elle est enregistrée ensuite, et seule une lecture (`instanceOf`) verrait l'état intermédiaire |
| Consommer tout le gaz dans `validateInstance` | `staticcall` avec limite de gaz explicite |
| Modifier un état pendant la validation | `staticcall` : toute écriture fait revert |
| Revert systématique | Seule cette épreuve est bloquée, les fonds et les autres épreuves continuent |
| Renvoyer des données mal formées | Décodage défensif : tout ce qui n'est pas exactement `true` compte comme « non résolu » |

### Arbitre

| Attaque | Parade | Reste possible ? |
| --- | --- | --- |
| Rendre une décision injuste | Sa décision ne porte que sur les fonds du litige. Dans le design complet, il n'est saisi qu'en appel ; dans la version déployée, il tranche directement chaque litige | **Oui**, dans ce périmètre |
| Ne jamais répondre | Timeout de 7 jours : n'importe qui appelle `applyVoteAfterTimeout`, le litige est rejeté (sans vote, c'est le résultat par défaut) | Non |
| Trancher pendant `openDispute` (réentrance) | `rule` et `openDispute` sont `nonReentrant` ; l'arbitre est `immutable` | Non |
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

Ces propriétés doivent être vraies à tout moment. Elles sont vérifiées par [`CTFPlatformInvariants.t.sol`](../contracts/contracts/CTFPlatformInvariants.t.sol) ([#31](https://github.com/Victorbriez/Pwnpot/issues/31)) : un *handler* enchaîne des actions aléatoires (créer un CTF, acheter un ticket, créer et soumettre une instance exploitée ou non, avancer le temps, finaliser, contester, faire trancher l'arbitre ou attendre son timeout, se faire rembourser, retirer, et un tiers ou le déployeur qui tente de trancher), puis chaque invariant est vérifié. 256 suites de 60 actions à chaque `pnpm contracts:test`, 10 000 avec `pnpm contracts:invariants` (environ 7 min). Sur 10 000 suites, toutes les issues sont atteintes (podium à 1, 2 et 3 gagnants, aucun gagnant, litige rejeté, timeout de l'arbitre, triche confirmée).

Bugs injectés pour vérifier que les invariants les détectent : un `withdraw` qui ne remet pas `owed` à zéro est détecté dès 256 suites (invariants 1, 2 et 6) ; un 3e du podium crédité deux fois n'est détecté qu'avec les 10 000 suites (invariants 1 et 2), car le cas à trois gagnants est plus rare. Lancer `pnpm contracts:invariants` avant chaque déploiement.

1. **Solvabilité** : `address(this).balance ≥ Σ owed[*] + Σ fonds encore bloqués dans les CTF en cours`.
2. **Conservation** : pour un CTF finalisé, `cash prize + Σ tickets + caution organisateur + caution de contestation = Σ crédits distribués + montant brûlé` (les frais d'arbitrage partent chez l'arbitre à l'ouverture du litige ; s'ils sont rendus au contestataire, c'est sur la caution de l'organisateur). Testé au wei près par `testFuzz_Conservation_WithDispute`.
3. **Une seule issue** : un CTF finalisé ne peut plus changer d'issue, et ses fonds ne sont crédités qu'une fois.
4. **Pas de réussite sans exploit** : `LevelSolved(ctf, level, player)` implique que `validateInstance(instance(player), player)` renvoyait `true` au moment de la soumission.
5. **Pas d'admin** : aucune fonction ne permet à une adresse fixe (déployeur compris) de déplacer des fonds ou de changer une règle.
6. **Retrait borné** : `withdraw` ne peut jamais envoyer plus que `owed[msg.sender]`, et remet cette valeur à zéro.

---

## Limites connues et assumées

- **La fuite de solution n'est pas prouvable.** Un organisateur qui donne la solution à un complice avant le CTF ne laisse aucune trace on-chain. Le design la rend **coûteuse** (caution) et **contestable** (litige), mais pas impossible.
- **Litiges simplifiés.** Le contrat déployé n'a ni vote des joueurs ni appel : la contestation part directement à l'arbitre (`vote` et `appeal` revert `NotImplemented`). C'est le plan B de [PLAN.md](PLAN.md#risques-et-plans-b), assumé faute de temps. L'interface (`Dispute`, events, phases) prévoit déjà la version complète.
- **L'arbitre est trusted.** Il est choisi au déploiement : c'est le seul choix du déployeur qui pèse sur les litiges. Dans la version déployée, il tranche seul chaque litige. En démo, `MockArbitrator` est contrôlé par l'équipe (le compte qui déploie rend les décisions). Il faut le dire explicitement au jury. Kleros se brancherait sans changer `CTFPlatform`.
- **Un litige retarde les gains.** N'importe quel détenteur de ticket peut bloquer `finalize` jusqu'à 7 jours en contestant. S'il a tort, il perd sa caution (versée à l'organisateur) et les frais d'arbitrage. Exception : un complice de l'organisateur ne perd que les frais, puisque sa caution revient à l'organisateur (voir [Organisateur malveillant](#organisateur-malveillant)).
- **Un seul litige par CTF, sans preuve on-chain.** Le premier contestataire prend la place. `openDispute` ne transmet aucun élément à l'arbitre (pas d'ERC-1497) : en démo, l'équipe qui tient `MockArbitrator` est informée hors chaîne.
- _(Design complet)_ **Le vote des joueurs ne serait pas neutre.** Les perdants ont intérêt à voter « triche ». L'appel corrige ce biais : un organisateur honnête avance les frais d'arbitrage, qui lui sont remboursés s'il gagne.
- **Les factories sont du code tiers.** La plateforme isole leur exécution, mais ne peut pas juger si une épreuve est « honnête ». C'est au joueur de lire le code vérifié.
- **Un exploit est copiable** une fois publié sur la chaîne. Le classement au temps limite l'intérêt de copier.
- **Le podium réduit l'intérêt de copier, mais ne le supprime pas.** Un copieur rapide peut finir 2e ou 3e et toucher une part de la cagnotte.
- **Le gas n'est pas remboursé** en cas de triche confirmée. Les joueurs récupèrent leur ticket, pas le gas dépensé.

---

## Passe de sécurité avant déploiement

Passe faite le 26 nov 2026 sur `master` (`52bb8ac`, litiges simplifiés), avant le redéploiement sur Base Sepolia ([#22](https://github.com/Victorbriez/Pwnpot/issues/22)).

### Slither

Slither 0.11.6, solc 0.8.34, mêmes réglages que le profil `production` (optimiseur, 200 runs). Depuis `contracts/` :

```bash
OZ=$(readlink -f node_modules/@openzeppelin/contracts)  # pnpm : chemin réel, pas le lien symbolique
slither contracts/CTFPlatform.sol \
  --solc-remaps "@openzeppelin/contracts/=$OZ/" \
  --solc-args "--optimize --optimize-runs 200 --allow-paths $OZ,$PWD" \
  --exclude-dependencies
```

Aucune alerte ne demande de correction. Chacune est écartée ci-dessous.

| Alerte | Où | Décision |
| --- | --- | --- |
| `reentrancy-eth` (High) | `openDispute` : `disputeID` écrit après `createDispute` | **Écartée.** L'arbitre est `immutable` et toutes les fonctions qui modifient l'état sont `nonReentrant` (`rule` compris) : il ne peut pas trancher pendant l'appel. L'identifiant n'est connu qu'au retour de `createDispute`. Seule une lecture (`getDispute`) verrait `disputeID = 0` pendant l'appel, sans effet sur les fonds. |
| `reentrancy-benign` (Low) | `openDispute` : `_disputeCtf` écrit après l'appel | **Écartée**, même raison. Un identifiant déjà utilisé fait revert (`DisputeAlreadyOpened`). |
| `reentrancy-no-eth` (Medium) | `createInstance` : `_instances` écrit après l'appel à la factory | **Écartée.** Même parade, testée par `test_MaliciousFactory_SubmitFromCreateInstance_Reverts` et `test_MaliciousFactory_WithdrawFromCreateInstance_Reverts`. |
| `uninitialized-state` (High) | `_levels`, `_podium` | **Faux positif.** Écrits par des pointeurs `storage` (`levels.push`, `podium[j] = …`), que Slither ne suit pas. |
| `uninitialized-local` (Medium) | `second`, `third` dans `_settle` | **Voulu.** Valent 0 quand la place est vide ; le 1er prend le reste. Conservation testée par `testFuzz_Conservation`. |
| `timestamp` (Low) | `createCTF`, `finalize`, `openDispute`, `applyVoteAfterTimeout`, `_phase` | **Accepté.** Les fenêtres se comptent en heures ou en jours ; quelques secondes de décalage ne changent rien. |
| `assembly` (Info) | `_validate` | **Revu.** `staticcall` avec `VALIDATION_GAS`, au plus 32 octets copiés, bloc `memory-safe`. |
| `low-level-calls` (Info) | `withdraw` | **Revu.** Solde remis à zéro avant le `call`, `nonReentrant`, revert si l'envoi échoue. |
| `pragma`, `solc-version` (Info) | OpenZeppelin en `^0.8.20` | **Sans objet.** Le code est compilé en 0.8.34, qui n'a pas les bugs cités. |

Les autres vérifications de Trail of Bits ne s'appliquent pas, après recherche dans le code : ni proxy ni `delegatecall` (pas de contrôle d'upgrade), pas de token (pas de contrôle ERC-20/721). Les signatures ERC-792 (`rule`, `createDispute`, `arbitrationCost`, event `Ruling`) sont conformes. Héritage : `ReentrancyGuard`, `ICTFPlatform` (lui-même `IArbitrable`), aucune variable masquée.

### Points d'entrée qui modifient l'état

| Fonction | Appelant attendu | Contrôle d'accès | `nonReentrant` |
| --- | --- | --- | --- |
| `createCTF` | Organisateur (n'importe qui) | Aucun, paramètres bornés | Oui |
| `buyTicket` | Joueur | Pas l'organisateur, un ticket par adresse | Oui |
| `createInstance` | Joueur | Détenteur de ticket, une instance par épreuve | Oui |
| `submit` | Joueur | Détenteur de ticket, sa propre instance seulement | Oui |
| `finalize` | N'importe qui | Après la fenêtre de contestation, sans litige ouvert | Oui |
| `openDispute` | Joueur | Détenteur de ticket, pendant la contestation, un litige par CTF | Oui |
| `rule` | Arbitre | `msg.sender == arbitrator` (`immutable`) | Oui |
| `applyVoteAfterTimeout` | N'importe qui | Litige ouvert depuis plus de `arbitratorTimeout` | Oui |
| `claimRefund` | Joueur | CTF finalisé sans gagnant ou triche confirmée, une fois | Oui |
| `withdraw` | Tout créancier | Son propre solde `owed` | Oui |
| `vote`, `appeal` | — | Revert `NotImplemented` (litiges simplifiés) | Sans objet |

Cohérent avec le [tableau des rôles](../README.md#rôles-et-confiance) : seule `rule` est réservée à une adresse, l'arbitre, choisi au déploiement et visible par tous. Aucune fonction n'appartient au déployeur.

### Tests

- **Couverture** (`hardhat test --coverage`) : 99 % des lignes de `CTFPlatform`. Deux lignes défensives ne sont pas atteintes : un arbitre qui réutiliserait un `disputeID` (revert `DisputeAlreadyOpened`) et un crédit de 0 wei (ignoré).
- **Profil production** : les 195 tests passent sur le bytecode optimisé.
- **Répétition sur un nœud local** : module Ignition `PwnpotModule` déployé tel quel (profil production, durées courtes), puis quatre parcours joués en vraies transactions avec l'ABI du frontend (triche confirmée, litige rejeté, timeout de l'arbitre, fin sans litige). Chaque refus attendu renvoie la bonne erreur. Après tous les retraits, le solde du contrat est égal au montant brûlé.
- **Reste à faire** : tests d'invariants avec état sur des suites d'appels aléatoires ([#31](https://github.com/Victorbriez/Pwnpot/issues/31), hors périmètre du code freeze). La répétition et `testFuzz_Conservation_WithDispute` couvrent les mêmes propriétés sur les parcours réels.

---

## Processus de vérification

Avant chaque déploiement sur Base Sepolia :

- [ ] `pnpm contracts:test` passe, avec un test d'exploit par épreuve et un test par issue (gagnant, aucun gagnant, litige rejeté, triche confirmée, timeout de l'arbitre).
- [ ] `pnpm --filter @pwnpot/contracts exec hardhat test --build-profile production` passe.
- [ ] `pnpm contracts:invariants` passe (10 000 suites d'actions aléatoires).
- [ ] Slither lancé (`pipx install slither-analyzer`) : chaque alerte est corrigée, ou écartée avec une justification écrite ici.
- [ ] Liste des points d'entrée qui modifient l'état revue après chaque changement de `CTFPlatform` (plugin `entry-point-analyzer`).
- [ ] Aucune clé, seed ni `.env` dans git.

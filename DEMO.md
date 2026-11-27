# Démo de soutenance

15 minutes en direct sur Base Sepolia (minutes 5 à 20 de la soutenance), sur le déploiement **démo** (`pwnpot-disputes-demo`) utilisé par [pwnpot.vercel.app](https://pwnpot.vercel.app). Dans ce document, **H** est l'heure de début de la soutenance.

## Ce que la démo doit montrer

| Exigence du jury                                                         | Où dans la démo                                                                                                                                                   |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Le parcours nominal, de bout en bout, confirmé sur le testnet            | Scénario 1 : création, ticket, instance, exploit, validation, finalisation, retrait                                                                               |
| La fonctionnalité décentralisée : l'argent ne bouge que selon les règles | Scénario 1 étape 7 (`finalize` appelé par un joueur, pas par l'organisateur), scénario 2 (l'arbitre ne tranche que le litige), scénario 3 (aucune fonction admin) |
| Au moins un échec, avec la raison affichée dans l'interface              | Scénario 1 étape 5 : `NotSolved`, « Ton instance n'est pas encore exploitée. ». Un second au choix du jury : [Échecs prêts à montrer](#échecs-prêts-à-montrer)    |
| L'explorer : contrat vérifié, transactions de la démo, events émis       | À chaque étape (colonne « Sur Basescan »)                                                                                                                         |

## Préparation

### Wallets

Un profil navigateur propre par rôle, wallet connecté sur Base Sepolia avant H.

| Rôle                                   | Profil navigateur                      | Wallet                                       | Solde à prévoir                                                         |
| -------------------------------------- | -------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------- |
| Organisateur                           | Profil A                               | `0x…`                                        | 0.02 ETH : 5 CTF × (cash prize 0.001 + caution 0.0013) + gas            |
| Joueur 1 (gagnant)                     | Profil B                               | `0x…`                                        | 0.005 ETH : 4 tickets × 0.0001 + gas                                    |
| Joueur 2 (perdant, contestataire)      | Profil C                               | `0x…`                                        | 0.01 ETH : 4 tickets + 2 litiges × (caution 0.001 + frais 0.0005) + gas |
| Déployeur, `ruler` de `MockArbitrator` | Terminal (keystore Hardhat) + Basescan | `0xA469B2A79DD89792D71921F987Dfdc0b189466ad` | 0.005 ETH de gas : `giveRuling` et `pnpm demo:codesafe`                 |
| Secours                                | —                                      | `0x…`                                        | 0.02 ETH, pour remplacer un wallet à sec                                |

Demander l'ETH Base Sepolia sur Teams **la veille**, pas le matin.

### Adresses (déploiement démo)

| Contrat                        | Adresse                                                                                                                                       |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `CTFPlatform`                  | [`0xb701e1c29F0cA0F237414a4F395Ed1f04e9fbf60`](https://sepolia.basescan.org/address/0xb701e1c29F0cA0F237414a4F395Ed1f04e9fbf60#code)          |
| `MockArbitrator`               | [`0x424daD72E083dD0011DC7F098A18b27692E9870D`](https://sepolia.basescan.org/address/0x424daD72E083dD0011DC7F098A18b27692E9870D#writeContract) |
| Factory « Coffre-fort à code » | [`0x029824C81B59de62D874d89dfDBFD8517708c7f0`](https://sepolia.basescan.org/address/0x029824C81B59de62D874d89dfDBFD8517708c7f0#code)          |
| Factory « Usurpateur »         | [`0x75561314e7A13132C2181de3A9Af063e5a57440e`](https://sepolia.basescan.org/address/0x75561314e7A13132C2181de3A9Af063e5a57440e#code)          |

Durées du déploiement démo (`ignition/parameters/demo.json`) : **10 min** de contestation, **15 min** avant le timeout de l'arbitre. Un CTF dure **au moins 1 h** (`MIN_DURATION`) : tout ce qui dépend du temps se prépare avant H.

Onglets à ouvrir avant H : la page `#code` de `CTFPlatform` sur Basescan, sa page `#events`, la page _Write Contract_ de `MockArbitrator`, et un terminal à la racine du repo (`pnpm demo:codesafe` lit le RPC et la clé dans le keystore Hardhat, mot de passe à saisir avant la démo).

### CTF à créer à l'avance

Tous avec cash prize **0.001 ETH**, ticket **0.0001 ETH**, **3 joueurs** maximum et la caution minimale proposée par le formulaire (0.0013 ETH), avec l'épreuve **Coffre-fort à code**.

| CTF                           | Début      | Fin        | À faire avant H                                                                                       | Sert à                                                    |
| ----------------------------- | ---------- | ---------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **A — En cours**              | H − 1 h    | H + 1 h    | Joueur 2 : ticket et instance (non exploitée)                                                         | Scénario 1, étapes 2 à 5                                  |
| **B — À finaliser**           | H − 1 h 25 | H − 15 min | Joueurs 1 et 2 : ticket. Joueur 1 : instance exploitée (`pnpm demo:codesafe`) et validée avant la fin | Scénario 1, étapes 6 à 8 (contestation finie à H − 5 min) |
| **C — Litige**                | H − 55 min | H + 7 min  | Joueurs 1 et 2 : ticket. Joueur 1 : épreuve validée                                                   | Scénario 2 (contestation ouverte de H + 7 à H + 17)       |
| **D — Arbitre muet** (option) | H − 1 h 20 | H − 20 min | Comme C, puis joueur 2 ouvre un litige vers H − 15 min, sans décision                                 | Scénario 2, étape 5 (timeout atteint vers H)              |

Créer A, B, C et D au plus tard à **H − 1 h 30** : un CTF doit commencer après sa création.

## Scénario 1 — Un CTF de bout en bout (~7 min)

| #   | Qui                         | Action                                                                                                                                                 | À l'écran                                                                                    | Sur Basescan                                                                                                    |
| --- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 1   | Organisateur                | « Organiser » → « Nouveau CTF » : créer un CTF (2 épreuves partagées, début dans 5 min). Il ne sert qu'à montrer la création                           | Badges « Code vérifié » sur les factories, total envoyé (cash prize + caution)               | Transaction, event `CTFCreated`                                                                                 |
| 2   | Joueur 1                    | Sur **A** : acheter un ticket                                                                                                                          | La cagnotte et le nombre de joueurs augmentent                                               | Event `TicketBought`                                                                                            |
| 3   | Joueur 1                    | « Créer mon instance » sur le Coffre-fort à code                                                                                                       | « Ton instance : 0x… »                                                                       | Event `InstanceCreated` (adresse de l'instance)                                                                 |
| 4   | Déployeur                   | `INSTANCE=0x… pnpm demo:codesafe` avec l'adresse affichée                                                                                              | Le terminal affiche le slot 1 (mot de passe « private »), puis la transaction `unlock`       | Transaction `unlock` sur l'instance                                                                             |
| 5   | Joueur 2, puis joueur 1     | « Vérifier ma réussite ». Le joueur 2 n'a rien exploité : **refus** « Ton instance n'est pas encore exploitée. » (`NotSolved`). Le joueur 1 est validé | Le classement de A se met à jour chez le joueur 2 sans recharger (rafraîchi toutes les 15 s) | Event `LevelSolved` (joueur 1). Le refus n'atteint pas la chaîne : le wallet ne propose même pas la transaction |
| 6   | —                           | Ouvrir **B** : fini depuis 15 min, contestation terminée                                                                                               | Statut, podium, « qui récupère quoi »                                                        | —                                                                                                               |
| 7   | **Joueur 2**                | `finalize` sur B. N'importe qui peut l'appeler : ni l'organisateur ni la plateforme n'ont la main                                                      | B passe en « Finalisé »                                                                      | Events `Credited` (joueur 1 : 0.0012 ETH, organisateur : caution 0.0013 ETH) puis `Finalized`                   |
| 8   | Joueur 1, puis organisateur | « Mon espace » → « Mes gains » → « Retirer »                                                                                                           | Le solde du wallet augmente                                                                  | Event `Withdrawn`                                                                                               |

## Scénario 2 — Litige tranché par l'arbitre (~5 min)

Version déployée : pas de vote ni d'appel, la contestation part directement à l'arbitre ERC-792.

1. **Joueur 2**, sur **C** (fin à H + 7 min, contestation ouverte) : « Ouvrir un litige ». → Le bouton affiche le total, caution 0.001 + frais 0.0005 ETH. Events `DisputeOpened` et `Appealed` (avec le `disputeID`). C passe en « Arbitrage ».
2. Montrer que l'argent est gelé : plus de bouton de finalisation, compte à rebours du timeout de l'arbitre.
3. **Déployeur**, sur Basescan _Write Contract_ de `MockArbitrator` : `giveRuling(disputeID, 2)` (« pas de triche »). → Event `RulingGiven` sur `MockArbitrator`, puis `Ruling` (ERC-792), `Ruled` et `Finalized` sur `CTFPlatform`.
4. Page de C : joueur 1 payé (0.0012 ETH), l'organisateur récupère sa caution plus celle du contestataire (0.0013 + 0.001 ETH), les frais d'arbitrage sont perdus.
5. Option, sur **D** : l'arbitre n'a pas répondu en 15 min. **N'importe qui** clique « Clore le litige (l'arbitre n'a pas répondu) ». → Le litige est rejeté et D se règle normalement : un arbitre muet ne bloque pas les fonds.

Variante à proposer si le jury la demande : `giveRuling(disputeID, 1)` (« triche ») → caution de l'organisateur brûlée, frais rendus au contestataire, cash prize rendu, tickets récupérés avec « Récupérer mon ticket » (`claimRefund`).

## Scénario 3 — Ce que personne ne peut faire (~2 min)

- Sur Basescan, `CTFPlatform` → _Write Contract_ : aucune fonction d'owner, de pause ou de retrait arbitraire. Les seules écritures sont celles des joueurs, de l'organisateur et de l'arbitre (`rule`).
- _Read Contract_ → `arbitrator` : l'adresse de l'arbitre est `immutable`, fixée au déploiement.

## Échecs prêts à montrer

Le jury demandera probablement un second échec. Dans l'interface, la plupart des actions interdites sont **désactivées avec leur raison** (organisateur qui veut jouer, « Rien à retirer », litige hors fenêtre). Pour un revert décodé, passer par Basescan _Write Contract_ de `CTFPlatform` avec le wallet concerné : l'estimation du gas échoue et Basescan affiche l'erreur.

| Tentative                             | Qui                           | Erreur                                                     |
| ------------------------------------- | ----------------------------- | ---------------------------------------------------------- |
| « Vérifier ma réussite » sans exploit | Joueur 2 sur A, dans le site  | `NotSolved` : « Ton instance n'est pas encore exploitée. » |
| `buyTicket(A)` une seconde fois       | Joueur 1                      | `AlreadyHasTicket`                                         |
| `buyTicket(A)`                        | Organisateur                  | `OrganizerCannotPlay`                                      |
| `finalize(C)` pendant l'arbitrage     | N'importe qui                 | `WrongPhase`                                               |
| `withdraw()` sans solde               | Joueur 2                      | `NothingToWithdraw`                                        |
| `rule(…)` sur `CTFPlatform`           | N'importe qui sauf l'arbitre  | `NotArbitrator`                                            |
| `giveRuling(…)` sur `MockArbitrator`  | N'importe qui sauf le `ruler` | `NotRuler`                                                 |

## Plan B

- **RPC public lent** : basculer `NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL` sur un RPC dédié et relancer le front en local (`pnpm dev`).
- **Un wallet à sec** : prendre le wallet de secours.
- **Frontend en panne** : jouer les mêmes étapes depuis Basescan, _Write Contract_.
- **Testnet inutilisable** : le dire au jury et basculer sur le nœud local, même code :
  1. `pnpm chain`, puis `pnpm chain:deploy` (écrit `.env.local`), puis `pnpm dev`.
  2. Réseau « Pwnpot local » dans le wallet : RPC `http://127.0.0.1:8545`, chain id `84532`, clés de test affichées par `pnpm chain`.
  3. Exploits : `PLAYER=3 CTF=0 LEVEL=0 pnpm chain:solve`. Temps : `ADVANCE=7200 pnpm chain:time`.
  4. Pas d'explorer en local : montrer les events dans le site.

## Répétitions

- [ ] Répétition 1 sur Base Sepolia, profils propres, chronomètre : 15 min maximum.
- [ ] Répétition 2 la veille au soir, avec les wallets du jour J.
- [ ] Le matin : soldes vérifiés, CTF A à D créés aux bonnes heures, onglets ouverts, keystore déverrouillé.

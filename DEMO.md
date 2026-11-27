# Démo de soutenance

15 minutes en direct sur Base Sepolia (minutes 5 à 20 de la soutenance), sur le déploiement **démo** (`pwnpot-disputes-demo`) utilisé par [pwnpot.vercel.app](https://pwnpot.vercel.app). Dans ce document, **H** est l'heure de début de la soutenance.

| Scénario                                                                                     | Durée  | Statut                                                                                         |
| -------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------- |
| [1 — Un CTF de bout en bout](#scénario-1--un-ctf-de-bout-en-bout-7-min)                      | ~7 min | obligatoire                                                                                    |
| [2 — Litige tranché par l'arbitre](#scénario-2--litige-tranché-par-larbitre-optionnel-5-min) | ~5 min | **optionnel** : seulement si les wallets ont l'ETH du litige (0.0015 ETH fixés par le contrat) |
| [3 — Ce que personne ne peut faire](#scénario-3--ce-que-personne-ne-peut-faire-2-min)        | ~2 min | obligatoire                                                                                    |

Sans le scénario 2, la démo se répète **seul**, avec trois comptes de test et environ **0.0025 ETH** au total.

## Ce que la démo doit montrer

| Exigence du jury                                                         | Où dans la démo                                                                                                                                                                |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Le parcours nominal, de bout en bout, confirmé sur le testnet            | Scénario 1 : création, ticket, instance, exploit, validation, finalisation, retrait                                                                                            |
| La fonctionnalité décentralisée : l'argent ne bouge que selon les règles | Scénario 1 étape 7 (`finalize` appelé par un joueur, pas par l'organisateur) et scénario 3 (aucune fonction admin). En option, scénario 2 (l'arbitre ne tranche que le litige) |
| Au moins un échec, avec la raison affichée dans l'interface              | Scénario 1 étape 5 : `NotSolved`, « Ton instance n'est pas encore exploitée. ». Un second au choix du jury : [Échecs prêts à montrer](#échecs-prêts-à-montrer)                 |
| L'explorer : contrat vérifié, transactions de la démo, events émis       | À chaque étape (colonne « Sur Basescan »)                                                                                                                                      |

Sans le scénario 2, le litige se présente pendant la revue de code : `openDispute` et `rule` dans `CTFPlatform.sol`, et leurs tests dans `CTFPlatformDisputes.t.sol`.

## Préparation

### Wallets

Trois comptes de test (une seule phrase de récupération MetaMask suffit, avec un compte par rôle), un profil navigateur propre par rôle, connecté sur Base Sepolia avant H.

| Rôle                                                                | Profil navigateur   | Wallet                                                                                                                          | Solde à prévoir                       | En plus pour le scénario 2                           |
| ------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------- |
| Organisateur                                                        | Profil A            | [`0x3EdfF6e03a3626F5850992647976585C96736865`](https://sepolia.basescan.org/address/0x3EdfF6e03a3626F5850992647976585C96736865) | 0.0015 ETH : 3 CTF × 0.0004 + gas     | + 0.0004 ETH (CTF C)                                 |
| Joueur 1 (gagnant), et compte du keystore pour `pnpm demo:codesafe` | Profil B + terminal | [`0xa25D8F838d0A957A76D9326e0DEa8235929E6477`](https://sepolia.basescan.org/address/0xa25D8F838d0A957A76D9326e0DEa8235929E6477) | 0.0003 ETH : 2 tickets × 0.0001 + gas | + 0.0001 ETH (ticket C)                              |
| Joueur 2 (perdant)                                                  | Profil C            | [`0x4e67D4170e6EbE29254931783B0C0a40C9457efC`](https://sepolia.basescan.org/address/0x4e67D4170e6EbE29254931783B0C0a40C9457efC) | 0.0003 ETH : 2 tickets × 0.0001 + gas | + 0.0016 ETH (ticket C, caution 0.001, frais 0.0005) |
| Déployeur, `ruler` de `MockArbitrator`                              | Basescan            | `0xA469B2A79DD89792D71921F987Dfdc0b189466ad`                                                                                    | —                                     | gas de `giveRuling`                                  |

Le gas de Base Sepolia est négligeable (0.006 gwei : toute la démo coûte moins de 0.0002 ETH). L'argent n'est pas consommé : il revient par les retraits une fois les CTF finalisés. Seuls les frais d'arbitrage du scénario 2 partent au déployeur (récupérables avec `withdrawFees`).

Pour approvisionner les comptes : les faucets listés sur [docs.base.org](https://docs.base.org/base-chain/tools/network-faucets) (limite par adresse et par jour, donc à réclamer sur chaque compte), ou Teams, **la veille**.

### Adresses (déploiement démo)

| Contrat                        | Adresse                                                                                                                                       |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `CTFPlatform`                  | [`0xb701e1c29F0cA0F237414a4F395Ed1f04e9fbf60`](https://sepolia.basescan.org/address/0xb701e1c29F0cA0F237414a4F395Ed1f04e9fbf60#code)          |
| `MockArbitrator`               | [`0x424daD72E083dD0011DC7F098A18b27692E9870D`](https://sepolia.basescan.org/address/0x424daD72E083dD0011DC7F098A18b27692E9870D#writeContract) |
| Factory « Coffre-fort à code » | [`0x029824C81B59de62D874d89dfDBFD8517708c7f0`](https://sepolia.basescan.org/address/0x029824C81B59de62D874d89dfDBFD8517708c7f0#code)          |
| Factory « Usurpateur »         | [`0x75561314e7A13132C2181de3A9Af063e5a57440e`](https://sepolia.basescan.org/address/0x75561314e7A13132C2181de3A9Af063e5a57440e#code)          |

Durées du déploiement démo (`ignition/parameters/demo.json`) : **10 min** de contestation, **15 min** avant le timeout de l'arbitre. Un CTF dure **au moins 1 h** (`MIN_DURATION`) : tout ce qui dépend du temps se prépare avant H.

Onglets à ouvrir avant H : la page `#code` de `CTFPlatform` sur Basescan, sa page `#events`, et un terminal à la racine du repo. Pour le scénario 2, la page _Write Contract_ de `MockArbitrator` dans le navigateur du déployeur.

### Script de l'exploit

`pnpm demo:codesafe` lit le RPC et la clé dans le keystore Hardhat de la machine qui le lance. `unlock` est ouvert à tous : n'importe quel compte de test approvisionné suffirait, mais on prend celui du **joueur 1** : c'est le joueur qui lit le mot de passe et ouvre son propre coffre, comme dans un vrai CTF. Jamais un wallet qui détient de vrais fonds. À faire une fois, la veille (chaque commande demande la valeur, puis le mot de passe du keystore) :

```bash
pnpm --filter @pwnpot/contracts exec hardhat keystore set BASE_SEPOLIA_RPC_URL
pnpm --filter @pwnpot/contracts exec hardhat keystore set BASE_SEPOLIA_PRIVATE_KEY
```

Le matin, lancer une fois `INSTANCE=<instance du joueur 2 sur A> READ_ONLY=1 pnpm demo:codesafe` (lecture seule : le joueur 1 ne touche pas au coffre du joueur 2) pour saisir le mot de passe du keystore et vérifier le RPC, sans rien envoyer.

### CTF à créer à l'avance

Tous avec l'épreuve **Coffre-fort à code**, cash prize **0.0001 ETH**, ticket **0.0001 ETH**, **2 joueurs** maximum et la caution calculée par le formulaire (0.0003 ETH) : **0.0004 ETH** envoyés par CTF.

| CTF                     | Début      | Fin        | À faire avant H                                                                                       | Sert à                                                    |
| ----------------------- | ---------- | ---------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **A — En cours**        | H − 1 h    | H + 1 h    | Joueur 2 : ticket et instance (non exploitée)                                                         | Scénario 1, étapes 2 à 5                                  |
| **B — À finaliser**     | H − 1 h 25 | H − 15 min | Joueurs 1 et 2 : ticket. Joueur 1 : instance exploitée (`pnpm demo:codesafe`) et validée avant la fin | Scénario 1, étapes 6 à 8 (contestation finie à H − 5 min) |
| **C — Litige** (option) | H − 55 min | H + 7 min  | Joueurs 1 et 2 : ticket. Joueur 1 : épreuve validée                                                   | Scénario 2 (contestation ouverte de H + 7 à H + 17)       |

Créer A, B et C au plus tard à **H − 1 h 30** : un CTF doit commencer après sa création.

## Scénario 1 — Un CTF de bout en bout (~7 min)

| #   | Qui                         | Action                                                                                                                                                 | À l'écran                                                                                    | Sur Basescan                                                                                                    |
| --- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 1   | Organisateur                | « Organiser » → « Nouveau CTF » : créer un CTF (2 épreuves partagées, début dans 5 min). Il ne sert qu'à montrer la création                           | Badges « Code vérifié » sur les factories, total envoyé (cash prize + caution)               | Transaction, event `CTFCreated`                                                                                 |
| 2   | Joueur 1                    | Sur **A** : acheter un ticket                                                                                                                          | La cagnotte et le nombre de joueurs augmentent                                               | Event `TicketBought`                                                                                            |
| 3   | Joueur 1                    | « Créer mon instance » sur le Coffre-fort à code                                                                                                       | « Ton instance : 0x… »                                                                       | Event `InstanceCreated` (adresse de l'instance)                                                                 |
| 4   | Joueur 1 (terminal)         | `INSTANCE=0x… pnpm demo:codesafe` avec l'adresse de son instance                                                                                       | Le terminal affiche le slot 1 (mot de passe « private »), puis la transaction `unlock`       | Transaction `unlock` sur l'instance                                                                             |
| 5   | Joueur 2, puis joueur 1     | « Vérifier ma réussite ». Le joueur 2 n'a rien exploité : **refus** « Ton instance n'est pas encore exploitée. » (`NotSolved`). Le joueur 1 est validé | Le classement de A se met à jour chez le joueur 2 sans recharger (rafraîchi toutes les 15 s) | Event `LevelSolved` (joueur 1). Le refus n'atteint pas la chaîne : le wallet ne propose même pas la transaction |
| 6   | —                           | Ouvrir **B** : fini depuis 15 min, contestation terminée                                                                                               | Statut, podium, « qui récupère quoi »                                                        | —                                                                                                               |
| 7   | **Joueur 2**                | `finalize` sur B. N'importe qui peut l'appeler : ni l'organisateur ni la plateforme n'ont la main                                                      | B passe en « Finalisé »                                                                      | Events `Credited` (joueur 1 : 0.0003 ETH, organisateur : caution 0.0003 ETH) puis `Finalized`                   |
| 8   | Joueur 1, puis organisateur | « Mon espace » → « Mes gains » → « Retirer »                                                                                                           | Le solde du wallet augmente                                                                  | Event `Withdrawn`                                                                                               |

## Scénario 2 — Litige tranché par l'arbitre (optionnel, ~5 min)

À jouer seulement si le CTF C est prêt et que le joueur 2 a 0.0015 ETH de plus. Version déployée : pas de vote ni d'appel, la contestation part directement à l'arbitre ERC-792. Il faut le déployeur, connecté sur Basescan.

1. **Joueur 2**, sur **C** (fin à H + 7 min, contestation ouverte) : « Ouvrir un litige ». → Le bouton affiche le total, caution 0.001 + frais 0.0005 ETH. Events `DisputeOpened` et `Appealed` (avec le `disputeID`). C passe en « Arbitrage ».
2. Montrer que l'argent est gelé : plus de bouton de finalisation, compte à rebours du timeout de l'arbitre.
3. **Déployeur**, sur Basescan _Write Contract_ de `MockArbitrator` : `giveRuling(disputeID, 2)` (« pas de triche »). → Event `RulingGiven` sur `MockArbitrator`, puis `Ruling` (ERC-792), `Ruled` et `Finalized` sur `CTFPlatform`.
4. Page de C : joueur 1 payé (0.0003 ETH), l'organisateur récupère sa caution plus celle du contestataire (0.0003 + 0.001 ETH), les frais d'arbitrage sont perdus.

Variante à proposer si le jury la demande : `giveRuling(disputeID, 1)` (« triche ») → caution de l'organisateur brûlée, frais rendus au contestataire dans la limite de cette caution (ici 0.0003 des 0.0005 ETH : le joueur 2 récupère 0.0013 ETH), cash prize rendu, tickets récupérés avec « Récupérer mon ticket » (`claimRefund`).

## Scénario 3 — Ce que personne ne peut faire (~2 min)

- Sur Basescan, `CTFPlatform` → _Write Contract_ : aucune fonction d'owner, de pause ou de retrait arbitraire. Les seules écritures sont celles des joueurs, de l'organisateur et de l'arbitre (`rule`).
- _Read Contract_ → `arbitrator` : l'adresse de l'arbitre est `immutable`, fixée au déploiement.

## Échecs prêts à montrer

Le jury demandera probablement un second échec. Dans l'interface, la plupart des actions interdites sont **désactivées avec leur raison** (organisateur qui veut jouer, « Rien à retirer », litige hors fenêtre). Pour un revert décodé, passer par Basescan _Write Contract_ de `CTFPlatform` avec le wallet concerné : l'estimation du gas échoue et Basescan affiche l'erreur. Aucun ne coûte d'ETH.

| Tentative                             | Qui                           | Erreur                                                     |
| ------------------------------------- | ----------------------------- | ---------------------------------------------------------- |
| « Vérifier ma réussite » sans exploit | Joueur 2 sur A, dans le site  | `NotSolved` : « Ton instance n'est pas encore exploitée. » |
| `buyTicket(A)` une seconde fois       | Joueur 1                      | `AlreadyHasTicket`                                         |
| `buyTicket(A)`                        | Organisateur                  | `OrganizerCannotPlay`                                      |
| `finalize(A)` pendant le jeu          | N'importe qui                 | `WrongPhase`                                               |
| `withdraw()` sans solde               | Joueur 2                      | `NothingToWithdraw`                                        |
| `rule(…)` sur `CTFPlatform`           | N'importe qui sauf l'arbitre  | `NotArbitrator`                                            |
| `giveRuling(…)` sur `MockArbitrator`  | N'importe qui sauf le `ruler` | `NotRuler`                                                 |

## Plan B

- **RPC public lent** : basculer `NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL` sur un RPC dédié et relancer le front en local (`pnpm dev`).
- **Un wallet à sec** : réclamer sur un faucet, ou transférer depuis un autre compte de test.
- **Frontend en panne** : jouer les mêmes étapes depuis Basescan, _Write Contract_.
- **Testnet inutilisable** : le dire au jury et basculer sur le nœud local, même code :
  1. `pnpm chain`, puis `pnpm chain:deploy` (écrit `.env.local`), puis `pnpm dev`.
  2. Réseau « Pwnpot local » dans le wallet : RPC `http://127.0.0.1:8545`, chain id `84532`, clés de test affichées par `pnpm chain`.
  3. Exploits : `PLAYER=3 CTF=0 LEVEL=0 pnpm chain:solve`. Temps : `ADVANCE=7200 pnpm chain:time`.
  4. Pas d'explorer en local : montrer les events dans le site.

## Répétitions

Sans le scénario 2, une seule personne peut tout répéter, en passant d'un profil navigateur à l'autre.

- [ ] Répétition 1 sur Base Sepolia, profils propres, chronomètre : 15 min maximum.
- [ ] Répétition 2 la veille au soir, avec les wallets du jour J.
- [ ] Le matin : soldes vérifiés, CTF A et B (et C si scénario 2) créés aux bonnes heures, onglets ouverts, `READ_ONLY=1 pnpm demo:codesafe` lancé une fois.

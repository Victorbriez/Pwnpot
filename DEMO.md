# Démo de soutenance

> **Brouillon.** À compléter avec les adresses réelles et à répéter **deux fois sur Base Sepolia** avant le code freeze, depuis des profils navigateur propres.

## Préparation

| Rôle | Profil navigateur | Wallet (Base Sepolia) | Solde minimum |
| --- | --- | --- | --- |
| Organisateur | Profil A | `0x…` | cash prize + caution + gas |
| Joueur 1 (gagnant) | Profil B | `0x…` | ticket + gas |
| Joueur 2 | Profil C | `0x…` | ticket + caution de contestation + frais d'arbitrage (0.0005 ETH) + gas |

- `CTFPlatform` (déploiement démo `pwnpot-disputes-demo`) : `0xb701e1c29F0cA0F237414a4F395Ed1f04e9fbf60` ([Basescan](https://sepolia.basescan.org/address/0xb701e1c29F0cA0F237414a4F395Ed1f04e9fbf60#code))
- `MockArbitrator` : `0x424daD72E083dD0011DC7F098A18b27692E9870D` ([Basescan](https://sepolia.basescan.org/address/0x424daD72E083dD0011DC7F098A18b27692E9870D#writeContract))
- Durées raccourcies pour la démo (`ignition/parameters/demo.json`) : contestation 10 min, timeout de l'arbitre 15 min.
- **Un CTF dure au moins 1 h** (`MIN_DURATION`) : les CTF de la démo se créent à l'avance, calés pour finir juste avant le passage.
- Le **compte qui a déployé** (`0xA469B2A79DD89792D71921F987Dfdc0b189466ad`) est le `ruler` de `MockArbitrator` : c'est lui qui rend les décisions (`giveRuling`), depuis Basescan / Blockscout (*Write Contract*).
- Contrats d'attaque des épreuves 1 et 2 déployés à l'avance par le joueur 1 : `0x…`

## Scénario 1 — Un CTF qui se passe bien (~6 min)

1. **Organisateur** : créer un CTF avec les 3 épreuves, cash prize 0.001 ETH, ticket 0.0001 ETH. → Montrer la transaction et l'event `CTFCreated` sur Basescan.
2. **Joueurs 1 et 2** : acheter un ticket. → La cagnotte augmente à l'écran.
3. **Joueur 1** : créer son instance de l'épreuve 3 (Coffre-fort à code).
4. **Joueur 1** : lire le slot 1 de son instance avec viem ou `cast storage`, puis appeler `unlock`.
5. **Joueur 1** : soumettre. → `LevelSolved`, le classement se met à jour sur l'écran du joueur 2 sans recharger la page.
6. **Joueur 2** : soumettre sans avoir exploité son instance. → Le revert est affiché avec son erreur décodée.
7. Attendre la fin de la contestation, puis appeler `finalize`.
8. **Joueur 1** : `withdraw`. → Le solde du wallet augmente. **Organisateur** : `withdraw` de sa caution.

## Scénario 2 — Litige tranché par l'arbitre (~4 min)

Version simplifiée du contrat : pas de vote ni d'appel, la contestation part directement à l'arbitre.

1. Sur un second CTF terminé, encore dans sa fenêtre de contestation, le **joueur 2** clique « Ouvrir un litige ». → Le bouton affiche le total (caution + frais) ; events `DisputeOpened` et `Appealed`, le CTF passe en « Arbitrage ».
2. Montrer que `finalize` est bloqué tant que l'arbitre n'a pas tranché, et le compte à rebours du timeout.
3. Le **déployeur** appelle `giveRuling(disputeID, 2)` sur `MockArbitrator` (« pas de triche »). → Event `Ruled`, le CTF est finalisé.
4. Montrer l'issue sur la page du CTF : gagnant payé, l'organisateur récupère sa caution plus celle du contestataire, les frais d'arbitrage sont perdus.
5. Variante si le temps le permet : `giveRuling(disputeID, 1)` (« triche ») → caution de l'organisateur brûlée, cash prize rendu, tickets remboursés (`claimRefund`).

## Scénario 3 — Ce que personne ne peut faire (~2 min)

- Montrer sur Basescan, onglet *Contract*, qu'il n'existe **aucune fonction admin** : pas d'owner, pas de pause.
- Tenter un `withdraw` sans rien devoir → erreur `NothingToWithdraw`.

## Plan B

- RPC public lent : basculer sur l'URL du fournisseur RPC dans `.env.local`.
- Plus de testnet ETH : wallets de secours `0x…` déjà approvisionnés.
- Frontend en panne : jouer le scénario depuis Basescan, *Write Contract*.

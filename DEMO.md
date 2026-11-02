# Démo de soutenance

> **Brouillon.** À compléter avec les adresses réelles et à répéter **deux fois sur Base Sepolia** avant le code freeze, depuis des profils navigateur propres.

## Préparation

| Rôle | Profil navigateur | Wallet (Base Sepolia) | Solde minimum |
| --- | --- | --- | --- |
| Organisateur | Profil A | `0x…` | cash prize + caution + gas |
| Joueur 1 (gagnant) | Profil B | `0x…` | ticket + gas |
| Joueur 2 | Profil C | `0x…` | ticket + caution de contestation + gas |

- `CTFPlatform` : `0x…` ([Basescan](https://sepolia.basescan.org/address/0x…))
- `MockArbitrator` : `0x…`
- Durées raccourcies pour la démo : contestation, vote et appel en minutes.
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

## Scénario 2 — Litige et appel (~4 min)

1. Sur un second CTF déjà terminé, le **joueur 2** ouvre un litige en déposant sa caution.
2. Vote des joueurs : « triche ».
3. L'**organisateur** fait appel. `MockArbitrator` rend la décision « pas de triche ».
4. Montrer l'issue : gagnant payé, l'organisateur récupère sa caution plus celle du contestataire.

## Scénario 3 — Ce que personne ne peut faire (~2 min)

- Montrer sur Basescan, onglet *Contract*, qu'il n'existe **aucune fonction admin** : pas d'owner, pas de pause.
- Tenter un `withdraw` sans rien devoir → erreur `NothingOwed`.

## Plan B

- RPC public lent : basculer sur l'URL du fournisseur RPC dans `.env.local`.
- Plus de testnet ETH : wallets de secours `0x…` déjà approvisionnés.
- Frontend en panne : jouer le scénario depuis Basescan, *Write Contract*.

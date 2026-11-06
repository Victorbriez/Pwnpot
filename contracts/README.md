# @pwnpot/contracts

Contrats de Pwnpot : Solidity 0.8.34, Hardhat 3 (toolbox viem), OpenZeppelin 5. Le design est décrit dans [../docs/DESIGN.md](../docs/DESIGN.md), les épreuves dans [../docs/CHALLENGES.md](../docs/CHALLENGES.md).

## Organisation

```
contracts/
  CTFPlatform.sol          cagnotte, tickets, cautions, scores, litiges, retraits   (à venir)
  interfaces/              ILevel, IArbitrator / IArbitrable (ERC-792)             (à venir)
  levels/                  factories + contrats vulnérables des épreuves            (à venir)
  mocks/MockArbitrator.sol arbitre de test et de démo                               (à venir)
  *.t.sol                  tests unitaires Solidity (forge-std)
test/                      tests d'intégration TypeScript (node:test + viem)
ignition/modules/          modules de déploiement
ignition/deployments/      trace des déploiements (chain-84532 committé)
```

## Commandes

Depuis la racine du repo :

```bash
pnpm contracts:build        # compile
pnpm contracts:test         # tests Solidity + TypeScript
pnpm contracts:typecheck    # compile puis tsc des tests et scripts
```

Ou directement dans ce dossier :

```bash
pnpm exec hardhat test solidity     # uniquement les .t.sol
pnpm exec hardhat test nodejs       # uniquement les tests TypeScript
pnpm exec hardhat test --build-profile production   # sur le bytecode optimisé, celui qu'on déploie
```

## Profils de compilation

| Profil | Optimiseur | Utilisé par |
| --- | --- | --- |
| `default` | désactivé | les tests : compilation plus rapide, meilleures traces |
| `production` | activé, 200 runs | Ignition et `verify` : c'est ce qui est déployé |

Les mesures de gaz faites en test (profil `default`) ne reflètent donc pas le coût réel en production.

## Déployer et vérifier

```bash
pnpm exec hardhat keystore set BASE_SEPOLIA_RPC_URL
pnpm exec hardhat keystore set BASE_SEPOLIA_PRIVATE_KEY
pnpm exec hardhat keystore set ETHERSCAN_API_KEY

pnpm exec hardhat ignition deploy ignition/modules/<Module>.ts --network baseSepolia
pnpm exec hardhat ignition verify chain-84532 --network baseSepolia
```

- Le keystore est chiffré et propre à chaque utilisateur de la machine. Son mot de passe ne se récupère pas.
- Pour que `ignition verify` fonctionne, ajouter le bloc `verify: { etherscan: { apiKey: configVariable("ETHERSCAN_API_KEY") } }` dans `hardhat.config.ts`.
- Committer `ignition/deployments/chain-84532/` après chaque déploiement, puis reporter les adresses dans le [README racine](../README.md#adresses-déployées).

## Règles de code

- `CTFPlatform` : pas d'owner, pas de proxy, pas de pause.
- Pull payment, checks-effects-interactions, `nonReentrant` sur tout ce qui envoie de l'ETH ou appelle une factory.
- Factories traitées comme du code non fiable : `staticcall` avec limite de gaz pour `validateInstance`.
- Erreurs personnalisées pour chaque refus, un event par étape.
- Chaque épreuve a un test qui rejoue son exploit. Chaque issue du cycle de vie a un test.

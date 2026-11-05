<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Pwnpot

Plateforme ouverte de CTF smart contracts payants. N'importe qui publie un CTF ; la cagnotte, les tickets et les cautions sont gérés uniquement par le contrat. Chaque épreuve est une paire factory / instance : le joueur exploite sa propre instance et la réussite est vérifiée on-chain par `validateInstance` (pas de flag).

Dossier projet (source de vérité fonctionnelle) : https://claude.ai/artifact/UB2mEKotkAwNjUbyVCiDYp

Doc du repo : `docs/DESIGN.md` (cycle de vie, flux d'argent, litiges, paramètres, interface cible de `CTFPlatform`), `docs/CHALLENGES.md` (les 3 épreuves), `docs/SECURITY.md` (modèle de menace), `DEMO.md` (scénario de soutenance). Le contenu du site (textes, exemples, données fictives) doit rester aligné sur ces fichiers.

## Stack

- **Frontend** : Next.js 16 (App Router, RSC), React 19, TypeScript, Tailwind CSS v4, shadcn/ui style `base-nova`.
- **Web3** : wagmi 3 + viem 2, réseau **Base Sepolia** uniquement.
- **Contrats** : Solidity 0.8.34, Hardhat 3 (toolbox viem, tests Solidity + `node:test`), OpenZeppelin 5, dans le workspace `contracts/` (`@pwnpot/contracts`).
- **Gestionnaire de paquets** : **pnpm** (jamais npm ou yarn pour installer). Repo en workspace pnpm : le frontend à la racine, les contrats dans `contracts/` (`pnpm --filter @pwnpot/contracts add …` pour y ajouter une dépendance).

## Organisation

```
app/ components/ hooks/ lib/   frontend Next
lib/onchain/wagmi.ts           config wagmi (Base Sepolia, connecteurs injected + Base Account)
lib/onchain/config.ts          réglages des composants @onchain-ui
contracts/                     workspace Hardhat (voir contracts/AGENTS.md)
  contracts/                   sources .sol et tests unitaires .t.sol
  test/                        tests d'intégration TypeScript
  ignition/modules/            modules de déploiement
docs/                          design, épreuves, sécurité
lib/mock/                      données fictives en attendant CTFPlatform
```

## UI

- Les primitives sont en **Base UI** (`@base-ui/react`), **pas Radix**. Ne pas installer `@radix-ui/*` ; si un composant de registry en tire, le convertir vers Base UI.
- Ajouter un composant avec `pnpm dlx shadcn@latest add <registry>/<item>` plutôt que de l'écrire à la main. Registries configurés dans `components.json` :
  - `@onchain-ui` : wallet, adresses / noms Base, soldes, sélection de réseau
  - `@trophy-ui` : classement, podium, badges
  - `@stepper` : étapes du cycle de vie d'un CTF
  - `@json-view-cn` : affichage d'events / transactions
  - `@basecn`, `@coss` : primitives Base UI supplémentaires
  - `@afterglow` : thème terminal (optionnel)
- Registries tiers : lire le code ajouté avant de le committer.
- Couleurs et rayons via les tokens CSS de `app/globals.css`, jamais de couleurs en dur. Classes combinées avec `cn()` (`@/lib/utils`).
- Alias : `@/components`, `@/components/ui`, `@/lib`, `@/hooks`.

## Web3 (frontend)

- Lire l'état depuis la chaîne et les events du contrat, pas depuis une base de données : la plateforme n'a pas de backend qui détient de l'état.
- Toute écriture passe par le wallet du joueur. Afficher l'état de la transaction (en attente, confirmée, échouée) et le lien vers l'explorer Base Sepolia.
- Montants en `bigint` (wei) jusqu'à l'affichage ; formater avec `formatEther` / `formatUnits`.
- Une seule config wagmi : `wagmiConfig` dans `lib/onchain/wagmi.ts`, typée via `Register`. Ne pas en créer d'autre.
- `@base-org/account` est exclu du bundle serveur (`serverExternalPackages` dans `next.config.ts`) : ne pas retirer cette ligne, le build casse sinon.

## Contrats

- `CTFPlatform` : **pas d'owner, pas de proxy, pas de pause**. Aucune fonction admin.
- **Pull payment** : créditer un solde interne, le bénéficiaire appelle `withdraw`. Jamais de transfert en boucle.
- **Checks-Effects-Interactions** + `nonReentrant` sur toute fonction qui bouge des fonds ou appelle une factory.
- Les factories sont écrites par les organisateurs, donc **non fiables** : validation via `staticcall` avec limite de gaz.
- L'adresse de l'arbitre (ERC-792) est fixée au déploiement (`immutable`).
- Un event par étape (création, ticket, réussite, litige, décision, retrait) : le frontend s'en sert.
- Chaque épreuve a un test Hardhat qui rejoue son exploit. Chaque issue du cycle de vie (gagnant, aucun gagnant, triche confirmée) a un test.

## Commandes

```bash
pnpm dev                  # serveur de dev
pnpm build                # build de prod
pnpm lint                 # ESLint (frontend)
pnpm typecheck            # tsc --noEmit (frontend)
pnpm format               # Prettier
pnpm contracts:build      # compile les contrats
pnpm contracts:test       # tests Solidity + TypeScript
pnpm contracts:typecheck  # compile puis tsc des tests/scripts Hardhat
pnpm chain                # nœud Hardhat local (chain id 84532, comme Base Sepolia)
pnpm chain:deploy         # déploie CTFPlatform + TestLevel en local, 2 CTF d'exemple, écrit .env.local
ADVANCE=7200 pnpm chain:time  # avance l'horloge du nœud local (en secondes)
```

Avant de considérer une tâche finie : `pnpm lint` et `pnpm typecheck` passent, plus `pnpm contracts:test` si un contrat a changé.

### Développement local

Le nœud local reprend l'identifiant de Base Sepolia (84532) : le front marche sans toucher à la config wagmi, seul le RPC change (`.env.local`).

1. `pnpm chain` dans un terminal, `pnpm chain:deploy` dans un autre, puis relancer `pnpm dev`.
2. Dans le wallet, ajouter un réseau « Pwnpot local » : RPC `http://127.0.0.1:8545`, chain id `84532`. Importer une clé de test affichée par `pnpm chain` (#2 alice : sans ticket ; #3 bob : ticket dans le CTF 0 ; #1 : organisateur).
3. Le nœud repart de zéro à chaque redémarrage (mêmes adresses de contrats). Relancer `pnpm chain:deploy` et vider l'activité du compte dans le wallet (nonce).
4. Les liens vers l'explorer ne marchent pas en local. Vider `.env.local` pour revenir au mode démo.
5. En local, la contestation dure 10 min au lieu de 48 h. Ne jamais lancer ces scripts sur Base Sepolia : ils refusent tout réseau autre que `localhost`.

## Secrets

- Frontend : variables dans `.env.local` (modèle : `.env.example`). Seules les `NEXT_PUBLIC_*` sont exposées au navigateur, n'y mettre aucun secret.
- Contrats : RPC et clé de déploiement dans le keystore Hardhat, jamais dans un fichier :
  `pnpm --filter @pwnpot/contracts exec hardhat keystore set BASE_SEPOLIA_RPC_URL` (idem `BASE_SEPOLIA_PRIVATE_KEY`).
- Clé de déploiement : un compte dédié au testnet, jamais un wallet qui détient des fonds réels.

## Git

- Commits au format Conventional Commits (`feat:`, `fix:`, `chore:`…).
- Ne jamais committer de clé privée, de seed ni de `.env*` ; seulement un `.env.example`.

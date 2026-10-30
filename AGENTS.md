<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Pwnpot

Plateforme ouverte de CTF smart contracts payants. N'importe qui publie un CTF ; la cagnotte, les tickets et les cautions sont gérés uniquement par le contrat. Chaque épreuve est une paire factory / instance : le joueur exploite sa propre instance et la réussite est vérifiée on-chain par `validateInstance` (pas de flag).

Dossier projet (source de vérité fonctionnelle) : https://claude.ai/artifact/UB2mEKotkAwNjUbyVCiDYp

## Stack

- **Frontend** : Next.js 16 (App Router, RSC), React 19, TypeScript, Tailwind CSS v4, shadcn/ui style `base-nova`.
- **Web3** : wagmi 3 + viem 2, réseau **Base Sepolia** uniquement.
- **Contrats** : Solidity, Hardhat, OpenZeppelin.
- **Gestionnaire de paquets** : **pnpm** (jamais npm ou yarn pour installer).

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
pnpm dev        # serveur de dev
pnpm build      # build de prod
pnpm lint       # ESLint
pnpm typecheck  # tsc --noEmit
pnpm format     # Prettier
```

Avant de considérer une tâche finie : `pnpm lint` et `pnpm typecheck` passent.

## Git

- Commits au format Conventional Commits (`feat:`, `fix:`, `chore:`…).
- Ne jamais committer de clé privée, de seed ni de `.env*` ; seulement un `.env.example`.

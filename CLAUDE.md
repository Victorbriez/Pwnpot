@AGENTS.md

# Spécifique à Claude Code

## Serveurs MCP du projet (`.mcp.json`)

- **shadcn** : chercher, voir et installer des composants dans les registries de `components.json`. À utiliser avant d'écrire un composant UI à la main.
- **next-devtools** : doc de Next 16 et état du `pnpm dev` en cours (erreurs, routes). Consulter la doc ici avant d'utiliser une API Next ; vérifier les erreurs runtime après une modif du frontend.
- **openzeppelin-contracts** : générer les bases de contrats OpenZeppelin.
- **context7** : doc à jour de wagmi, viem, Hardhat et Base UI quand un doute existe sur une API.

## Skills à charger

- **shadcn** : tout travail sur un composant UI ou sur `components.json`.
- **migrate-radix-to-base** : quand un composant ajouté importe `@radix-ui/*`.
- **wagmi** : hooks et config wallet côté React / Next.
- **viem** : scripts Node, déploiement, lecture de la chaîne hors React.
- **impeccable** ou **frontend-design** : quand on conçoit ou retouche un écran.

## Sécurité des contrats (plugins Trail of Bits)

- `entry-point-analyzer` : lister les fonctions qui modifient l'état après chaque changement de `CTFPlatform` ou d'une factory.
- `building-secure-contracts:secure-workflow-guide` : passe complète avant un déploiement sur Base Sepolia (nécessite Slither : `pipx install slither-analyzer`).
- `building-secure-contracts:guidelines-advisor` : revue de conception (CEI, pull payment, events).
- Vérifier en particulier les risques listés dans la section « Sécurité et limites connues » du dossier projet : factory malveillante, exploits copiables, Sybil sur le vote.

## Vérification

- Après une modif du frontend : `pnpm lint`, `pnpm typecheck`, puis contrôle des erreurs via next-devtools si `pnpm dev` tourne.
- Après une modif de contrat : les tests Hardhat passent, puis `entry-point-analyzer`.

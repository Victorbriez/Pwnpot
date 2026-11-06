// Copie dans le front ce qu'il lui faut des contrats (produits par `hardhat build`) :
//
// - l'ABI de CTFPlatform (lib/onchain/ctf-platform-abi.ts). L'ABI décrit les
//   fonctions et events du contrat : wagmi et viem s'en servent pour encoder
//   les appels et décoder les réponses ;
// - de quoi déployer et reconnaître une VaultFactory (lib/onchain/level-artifacts.ts) :
//   le Coffre se déploie une fois par CTF, depuis le wallet de l'organisateur ;
// - les custom errors des trois factories, pour afficher leur nom quand
//   `createInstance` revert dans la factory.
//
//   pnpm abi
import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

type AbiItem = { type: string; name?: string }
type Artifact = {
  abi: AbiItem[]
  bytecode: string
  deployedBytecode: string
  immutableReferences?: Record<string, { start: number; length: number }[]>
}

function artifact(source: string, name: string): Artifact {
  const path = fileURLToPath(
    new URL(`../artifacts/contracts/${source}/${name}.json`, import.meta.url)
  )
  return JSON.parse(readFileSync(path, "utf8")) as Artifact
}

function target(file: string) {
  return fileURLToPath(new URL(`../../lib/onchain/${file}`, import.meta.url))
}

const json = (value: unknown) => JSON.stringify(value, null, 2)

const platform = artifact("CTFPlatform.sol", "CTFPlatform")
writeFileSync(
  target("ctf-platform-abi.ts"),
  `// Généré par \`pnpm abi\` depuis contracts/contracts/CTFPlatform.sol.
// Ne pas modifier à la main : relancer \`pnpm abi\` après un changement du contrat.
export const ctfPlatformAbi = ${json(platform.abi)} as const
`
)

const vault = artifact("levels/Vault.sol", "VaultFactory")
const factories = [
  vault,
  artifact("levels/Impostor.sol", "ImpostorFactory"),
  artifact("levels/CodeSafe.sol", "CodeSafeFactory"),
]

// Une seule entrée par nom d'erreur (ZeroAddress, OnlyPlatform… sont partagées).
const errors = new Map<string, AbiItem>()
for (const { abi } of factories)
  for (const item of abi)
    if (item.type === "error" && item.name && !errors.has(item.name))
      errors.set(item.name, item)

// Octets des variables `immutable` (platform, organizer) dans le code déployé :
// ils changent à chaque déploiement, le reste du code est identique.
const immutables = Object.values(vault.immutableReferences ?? {})
  .flat()
  .sort((a, b) => a.start - b.start)

writeFileSync(
  target("level-artifacts.ts"),
  `// Généré par \`pnpm abi\` depuis contracts/contracts/levels/.
// Ne pas modifier à la main : relancer \`pnpm abi\` après un changement d'une épreuve.

/** ABI de VaultFactory (Épreuve 1, Coffre). */
export const vaultFactoryAbi = ${json(vault.abi)} as const

/** Bytecode de création de VaultFactory : le front la déploie pour l'organisateur. */
export const vaultFactoryBytecode = "${vault.bytecode}" as const

/** Code déployé de VaultFactory, pour reconnaître un Coffre à son code. */
export const vaultFactoryDeployedBytecode = "${vault.deployedBytecode}" as const

/** Plages (en octets) des variables \`immutable\` dans le code déployé. */
export const vaultFactoryImmutables = ${json(immutables)} as const

/** Custom errors des trois factories, pour décoder un revert de \`createInstance\`. */
export const levelErrorsAbi = ${json([...errors.values()])} as const
`
)

console.log("ABI et artefacts des épreuves écrits dans lib/onchain/")

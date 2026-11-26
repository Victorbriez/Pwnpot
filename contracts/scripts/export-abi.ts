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
  inputSourceName?: string
  buildInfoId?: string
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

// Entrée de compilation du Coffre, pour le faire vérifier par Sourcify depuis le
// navigateur (chaque organisateur déploie le sien, à une nouvelle adresse).
// Même compilation que `vaultFactoryBytecode` : mêmes réglages, et seulement
// les sources dont dépend Vault.sol (les seules dans ses métadonnées, donc
// celles qui fixent son bytecode).
type BuildInfo = {
  solcLongVersion: string
  input: {
    language: string
    sources: Record<string, { content: string }>
    settings: Record<string, unknown> & { outputSelection?: unknown }
  }
}
const vaultBuild = JSON.parse(
  readFileSync(
    fileURLToPath(
      new URL(
        `../artifacts/build-info/${vault.buildInfoId}.json`,
        import.meta.url
      )
    ),
    "utf8"
  )
) as BuildInfo
const remappings = (vaultBuild.input.settings.remappings ?? []) as string[]

/** Chemin d'un import, résolu comme solc (relatif, ou via les remappings). */
function resolveImport(from: string, path: string): string {
  if (path.startsWith(".")) {
    const parts = from.split("/").slice(0, -1)
    for (const part of path.split("/")) {
      if (part === "..") parts.pop()
      else if (part !== ".") parts.push(part)
    }
    return parts.join("/")
  }
  for (const remapping of remappings) {
    const [context, rest] = remapping.split(/:(.*)/s)
    const [prefix, targetPrefix] = rest.split("=")
    if (from.startsWith(context) && path.startsWith(prefix))
      return targetPrefix + path.slice(prefix.length)
  }
  return path
}

const vaultSources: Record<string, { content: string }> = {}
const queue = [vault.inputSourceName!]
while (queue.length > 0) {
  const name = queue.pop()!
  if (vaultSources[name]) continue
  const source = vaultBuild.input.sources[name]
  if (!source) throw new Error(`Source absente du build-info : ${name}`)
  vaultSources[name] = source
  for (const [, path] of source.content.matchAll(
    /^import\s[^"']*["']([^"']+)["']/gm
  ))
    queue.push(resolveImport(name, path))
}

const { outputSelection: _unused, ...vaultSettings } = vaultBuild.input.settings
const vaultVerification = {
  compilerVersion: vaultBuild.solcLongVersion,
  contractIdentifier: `${vault.inputSourceName}:VaultFactory`,
  stdJsonInput: {
    language: vaultBuild.input.language,
    sources: Object.fromEntries(
      Object.entries(vaultSources).sort(([a], [b]) => a.localeCompare(b))
    ),
    settings: {
      ...vaultSettings,
      outputSelection: {
        "*": { "*": ["abi", "evm.bytecode", "evm.deployedBytecode"] },
      },
    },
  },
}

writeFileSync(
  target("vault-source.ts"),
  `// Généré par \`pnpm abi\` depuis contracts/contracts/levels/Vault.sol.
// Ne pas modifier à la main : relancer \`pnpm abi\` après un changement d'une épreuve.

/**
 * Entrée de compilation de VaultFactory (même compilation que
 * \`vaultFactoryBytecode\`), envoyée à Sourcify pour vérifier chaque Coffre.
 * Chargée à la demande : seul le flux de vérification en a besoin.
 */
export const vaultVerification = ${json(vaultVerification)} as const
`
)

console.log("ABI et artefacts des épreuves écrits dans lib/onchain/")

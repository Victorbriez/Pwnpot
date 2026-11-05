// Copie l'ABI de CTFPlatform (produite par `hardhat build`) dans le front.
// L'ABI décrit les fonctions et events du contrat : wagmi et viem s'en
// servent pour encoder les appels et décoder les réponses.
//
//   pnpm abi
import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

const artifact = fileURLToPath(
  new URL(
    "../artifacts/contracts/CTFPlatform.sol/CTFPlatform.json",
    import.meta.url
  )
)
const target = fileURLToPath(
  new URL("../../lib/onchain/ctf-platform-abi.ts", import.meta.url)
)

const { abi } = JSON.parse(readFileSync(artifact, "utf8")) as { abi: unknown }

writeFileSync(
  target,
  `// Généré par \`pnpm abi\` depuis contracts/contracts/CTFPlatform.sol.
// Ne pas modifier à la main : relancer \`pnpm abi\` après un changement du contrat.
export const ctfPlatformAbi = ${JSON.stringify(abi, null, 2)} as const
`
)

console.log(`ABI écrite dans ${target}`)

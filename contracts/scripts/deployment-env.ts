// Affiche les variables d'environnement du front pour un déploiement Ignition,
// à coller dans Vercel (Settings → Environment Variables) ou dans .env.local.
//
//   pnpm contracts:env                          # déploiement chain-84532
//   DEPLOYMENT=local-check pnpm contracts:env   # un autre déploiement
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

const id = process.env.DEPLOYMENT ?? "chain-84532"
const dir = fileURLToPath(
  new URL(`../ignition/deployments/${id}/`, import.meta.url)
)

let addresses: Record<string, string>
let journal: string
try {
  addresses = JSON.parse(readFileSync(`${dir}deployed_addresses.json`, "utf8"))
  journal = readFileSync(`${dir}journal.jsonl`, "utf8")
} catch {
  throw new Error(
    `Déploiement « ${id} » introuvable dans contracts/ignition/deployments/. Lancer \`pnpm contracts:deploy\` d'abord.`
  )
}

const platform = addresses["PwnpotModule#CTFPlatform"]
const testLevel = addresses["PwnpotModule#TestLevel"]
if (!platform) throw new Error(`CTFPlatform absent du déploiement « ${id} ».`)

// Bloc du déploiement de CTFPlatform : le front lit les events à partir de là.
const confirm = journal
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line))
  .find(
    (entry) =>
      entry.type === "TRANSACTION_CONFIRM" &&
      entry.futureId === "PwnpotModule#CTFPlatform"
  )
const block = confirm?.receipt?.blockNumber
if (block === undefined)
  throw new Error("Bloc de déploiement de CTFPlatform introuvable.")

console.log(`NEXT_PUBLIC_CTF_PLATFORM_ADDRESS=${platform}
NEXT_PUBLIC_CTF_PLATFORM_DEPLOY_BLOCK=${block}${testLevel ? `\nNEXT_PUBLIC_TEST_FACTORY_ADDRESS=${testLevel}` : ""}`)

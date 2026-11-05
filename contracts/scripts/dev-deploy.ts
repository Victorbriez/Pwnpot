// Déploiement de développement sur le nœud local (`pnpm chain`).
//
// Déploie CTFPlatform et TestLevel, crée deux CTF d'exemple, puis écrit
// l'adresse du contrat et le RPC local dans `.env.local` à la racine du repo.
// Refuse de tourner sur un autre réseau que `localhost`.
//
//   pnpm chain          # terminal 1
//   pnpm chain:deploy   # terminal 2
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

import { network } from "hardhat"
import { parseEther } from "viem"

const LOCAL_RPC = "http://127.0.0.1:8545"
const BASE_SEPOLIA_ID = 84532

const MINUTE = 60n
const HOUR = 60n * MINUTE
const DAY = 24n * HOUR

const connection = await network.create()
if (connection.networkName !== "localhost") {
  throw new Error(
    `dev-deploy ne tourne que sur le nœud local (--network localhost), pas sur « ${connection.networkName} ».`
  )
}

const { viem, networkHelpers } = connection
const publicClient = await viem.getPublicClient()
const chainId = await publicClient.getChainId()
if (chainId !== BASE_SEPOLIA_ID) {
  throw new Error(
    `Le nœud local doit tourner avec --chain-id ${BASE_SEPOLIA_ID} (reçu ${chainId}). Lancer \`pnpm chain\`.`
  )
}

// Comptes du nœud Hardhat (mnémonique de test public, aucune valeur réelle).
const [deployer, organizer, alice, bob, , , , , , arbitrator] =
  await viem.getWalletClients()

// Durées courtes en local pour tester la finalisation sans attendre 48 h.
// En vrai (docs/DESIGN.md § Paramètres) : 48 h, 48 h, 24 h, 7 j.
const periods = {
  contestation: 10n * MINUTE,
  voting: 10n * MINUTE,
  appeal: 5n * MINUTE,
  arbitratorTimeout: 30n * MINUTE,
}

// Multicall3 à son adresse standard, comme sur Base Sepolia : wagmi s'en sert
// pour regrouper les lectures. Bytecode récupéré sur Base (identique partout).
const MULTICALL3 = "0xcA11bde05977b3631167028862bE2a173976CA11"
const multicallCode = readFileSync(
  fileURLToPath(new URL("./data/multicall3.hex", import.meta.url)),
  "utf8"
).trim() as `0x${string}`
await networkHelpers.setCode(MULTICALL3, multicallCode)

// Point de départ de la lecture des events par le front.
const deployBlock = await publicClient.getBlockNumber()

// Le premier compte (deployer) déploie par défaut.
const platform = await viem.deployContract("CTFPlatform", [
  arbitrator.account.address,
  periods.contestation,
  periods.voting,
  periods.appeal,
  periods.arbitratorTimeout,
])
const testLevel = await viem.deployContract("TestLevel")

// Deux CTF d'exemple : un qui démarre tout de suite, un à venir.
const now = BigInt(await networkHelpers.time.latest())
const cashPrize = parseEther("1")
const ticketPrice = parseEther("0.01")
const maxPlayers = 20n
const organizerBond = cashPrize + maxPlayers * ticketPrice

const samples = [
  {
    title: "Démo locale : en cours",
    startTime: now + MINUTE,
    duration: 2n * HOUR,
  },
  { title: "Démo locale : à venir", startTime: now + DAY, duration: DAY },
]

for (const s of samples) {
  const hash = await platform.write.createCTF(
    [
      {
        title: s.title,
        startTime: s.startTime,
        endTime: s.startTime + s.duration,
        ticketPrice,
        maxPlayers,
        cashPrize,
        organizerBond,
      },
      [testLevel.address],
    ],
    { account: organizer.account, value: cashPrize + organizerBond }
  )
  await publicClient.waitForTransactionReceipt({ hash })
}

// bob prend un ticket dans le premier CTF, puis on passe son départ.
const ticketHash = await platform.write.buyTicket([0n], {
  account: bob.account,
  value: ticketPrice,
})
await publicClient.waitForTransactionReceipt({ hash: ticketHash })
await networkHelpers.time.increaseTo(samples[0].startTime)

// Écrit l'adresse et le RPC local dans .env.local, sans toucher au reste.
const envPath = fileURLToPath(new URL("../../.env.local", import.meta.url))
const values: Record<string, string> = {
  NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL: LOCAL_RPC,
  NEXT_PUBLIC_CTF_PLATFORM_ADDRESS: platform.address,
  NEXT_PUBLIC_CTF_PLATFORM_DEPLOY_BLOCK: deployBlock.toString(),
  NEXT_PUBLIC_TEST_FACTORY_ADDRESS: testLevel.address,
}
let env = existsSync(envPath) ? readFileSync(envPath, "utf8") : ""
for (const [key, value] of Object.entries(values)) {
  const line = `${key}=${value}`
  const pattern = new RegExp(`^${key}=.*$`, "m")
  env = pattern.test(env)
    ? env.replace(pattern, line)
    : `${env}${env && !env.endsWith("\n") ? "\n" : ""}${line}\n`
}
writeFileSync(envPath, env)

console.log(`
CTFPlatform  ${platform.address}
TestLevel    ${testLevel.address}  (factory de test, proposée dans le formulaire de création)

Comptes (clés privées affichées par \`pnpm chain\`) :
  #0 déployeur    ${deployer.account.address}
  #1 organisateur ${organizer.account.address}  (a créé les CTF 0 et 1)
  #2 alice        ${alice.account.address}  (aucun ticket : pour tester l'achat)
  #3 bob          ${bob.account.address}  (ticket dans le CTF 0)
  #9 arbitre      ${arbitrator.account.address}

CTF 0 « ${samples[0].title} » : en cours, se termine dans 2 h.
CTF 1 « ${samples[1].title} » : démarre dans 24 h.
Contestation : ${periods.contestation / MINUTE} min (au lieu de 48 h).

.env.local mis à jour. Relancer \`pnpm dev\` pour qu'il soit pris en compte.
Avancer le temps : ADVANCE=7200 pnpm chain:time
`)

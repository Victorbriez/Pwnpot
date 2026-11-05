// Résout l'instance de test d'un joueur sur le nœud local (`pnpm chain`) :
// l'« exploit » de TestLevel est un simple appel à `solve()` par le joueur.
// Le joueur doit d'abord créer son instance dans l'UI.
//
//   PLAYER=2 CTF=0 LEVEL=0 pnpm chain:solve   # compte #2 (alice)
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

import { network } from "hardhat"
import { getAddress, zeroAddress } from "viem"

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
const level = BigInt(intEnv("LEVEL", 0))

// Adresse écrite par `pnpm chain:deploy`.
const envPath = fileURLToPath(new URL("../../.env.local", import.meta.url))
const match = readFileSync(envPath, "utf8").match(
  /^NEXT_PUBLIC_CTF_PLATFORM_ADDRESS=(0x[0-9a-fA-F]{40})$/m
)
if (!match) throw new Error("Lancer `pnpm chain:deploy` d'abord.")

const { viem } = connection
const publicClient = await viem.getPublicClient()
const wallets = await viem.getWalletClients()
const player = wallets[playerIndex]
if (!player) throw new Error(`Pas de compte #${playerIndex}.`)

const platform = await viem.getContractAt("CTFPlatform", getAddress(match[1]))
const instance = await platform.read.instanceOf([
  ctfId,
  level,
  player.account.address,
])
if (instance === zeroAddress) {
  throw new Error(
    `Le compte #${playerIndex} n'a pas d'instance pour l'épreuve ${level} du CTF ${ctfId} : la créer dans l'UI.`
  )
}

const testInstance = await viem.getContractAt("TestInstance", instance)
const hash = await testInstance.write.solve({ account: player.account })
await publicClient.waitForTransactionReceipt({ hash })

console.log(
  `Instance ${instance} résolue par le compte #${playerIndex}. Cliquer « Vérifier ma réussite » dans l'UI.`
)

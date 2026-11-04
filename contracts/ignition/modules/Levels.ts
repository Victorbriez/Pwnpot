import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"

// Déploie les factories des 3 épreuves (docs/CHALLENGES.md).
//
// Paramètres :
// - platform : seule adresse autorisée à créer des instances. Par défaut le
//   déployeur, en attendant CTFPlatform.
// - vaultSeed : solde de départ de chaque Coffre, en wei (décision n° 8).
//   0.0001 ETH par défaut.
//
// La factory du Coffre doit ensuite être alimentée en lui envoyant de l'ETH.
export default buildModule("LevelsModule", (m) => {
  const platform = m.getParameter("platform", m.getAccount(0))
  const vaultSeed = m.getParameter("vaultSeed", 100_000_000_000_000n)

  const vaultFactory = m.contract("VaultFactory", [platform, vaultSeed])
  const impostorFactory = m.contract("ImpostorFactory", [platform])
  const codeSafeFactory = m.contract("CodeSafeFactory", [platform])

  return { vaultFactory, impostorFactory, codeSafeFactory }
})

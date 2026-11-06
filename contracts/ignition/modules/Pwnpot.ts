import { buildModule } from "@nomicfoundation/hardhat-ignition/modules"

const HOUR = 3600n
const DAY = 24n * HOUR

// Déploiement de Pwnpot (docs/DESIGN.md § Paramètres).
//
// - MockArbitrator : arbitre ERC-792 de démo, frais fixes de 0.0005 ETH, décisions
//   rendues par le compte qui déploie.
// - CTFPlatform : arbitre et quatre durées fixés à vie (`immutable`). Valeurs par
//   défaut = celles de DESIGN.md ; ignition/parameters/demo.json les réduit à
//   quelques minutes pour la démo.
// Ne pas déployer ce module sur `localhost` sans `--deployment-id` : le nœud local a
// le même chain id que Base Sepolia, Ignition écraserait chain-84532. En local,
// utiliser `pnpm chain:deploy`.
//
// - TestLevel : factory de test (épreuve sans exploit), en attendant les vraies
//   épreuves (#7, #13, #14).
export default buildModule("PwnpotModule", (m) => {
  const arbitrationFee = m.getParameter("arbitrationFee", 500_000_000_000_000n)
  const contestationPeriod = m.getParameter("contestationPeriod", 48n * HOUR)
  const votingPeriod = m.getParameter("votingPeriod", 48n * HOUR)
  const appealPeriod = m.getParameter("appealPeriod", 24n * HOUR)
  const arbitratorTimeout = m.getParameter("arbitratorTimeout", 7n * DAY)

  const arbitrator = m.contract("MockArbitrator", [
    arbitrationFee,
    m.getAccount(0),
  ])
  const platform = m.contract("CTFPlatform", [
    arbitrator,
    contestationPeriod,
    votingPeriod,
    appealPeriod,
    arbitratorTimeout,
  ])
  const testLevel = m.contract("TestLevel")

  return { arbitrator, platform, testLevel }
})

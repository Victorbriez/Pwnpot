import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem"
import { configVariable, defineConfig } from "hardhat/config"

export default defineConfig({
  plugins: [hardhatToolboxViemPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.34",
      },
      production: {
        version: "0.8.34",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  // Vérification du code sur Basescan (API Etherscan v2), Blockscout et Sourcify.
  // Clé lue dans le keystore : pnpm hardhat keystore set ETHERSCAN_API_KEY
  verify: {
    etherscan: {
      apiKey: configVariable("ETHERSCAN_API_KEY"),
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    // Simulated chain served by `pnpm chain` (`hardhat node --network chain`).
    // Chain id 84532 like Base Sepolia, so the frontend works without changing
    // its wagmi config. Base fee at 0: MetaMask knows chain 84532 and offers
    // Base Sepolia gas prices (~0.01 gwei), below the 1 gwei a default node
    // asks for, so every transaction from the wallet would be rejected.
    chain: {
      type: "edr-simulated",
      chainType: "op",
      chainId: 84532,
      initialBaseFeePerGas: 0,
    },
    // Local node started by `pnpm chain`, seen from scripts (`--network localhost`).
    localhost: {
      type: "http",
      chainType: "op",
      url: "http://127.0.0.1:8545",
    },
    // Secrets come from the Hardhat keystore:
    //   pnpm hardhat keystore set BASE_SEPOLIA_RPC_URL
    //   pnpm hardhat keystore set BASE_SEPOLIA_PRIVATE_KEY
    baseSepolia: {
      type: "http",
      chainType: "op",
      url: configVariable("BASE_SEPOLIA_RPC_URL"),
      accounts: [configVariable("BASE_SEPOLIA_PRIVATE_KEY")],
    },
  },
})

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
    // Local node started by `pnpm chain` (chain id 84532, like Base Sepolia,
    // so the frontend works without changing its wagmi config).
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

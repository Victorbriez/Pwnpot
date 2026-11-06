import { createConfig, http } from "wagmi"
import { baseSepolia } from "wagmi/chains"
import { baseAccount, injected } from "wagmi/connectors"

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [injected(), baseAccount({ appName: "Pwnpot" })],
  transports: {
    // Empty value falls back to publicnode: sepolia.base.org caps eth_getLogs
    // at 200 blocks, publicnode at 50 000 (see usePlatformEvents).
    [baseSepolia.id]: http(
      process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL ||
        "https://base-sepolia-rpc.publicnode.com"
    ),
  },
  ssr: true,
})

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig
  }
}

import { createConfig, http } from "wagmi"
import { baseSepolia } from "wagmi/chains"
import { baseAccount, injected } from "wagmi/connectors"

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [injected(), baseAccount({ appName: "Pwnpot" })],
  transports: {
    // Empty value falls back to the chain's public RPC.
    [baseSepolia.id]: http(
      process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || undefined
    ),
  },
  ssr: true,
})

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig
  }
}

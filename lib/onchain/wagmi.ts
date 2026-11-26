import { createConfig, http } from "wagmi"
import { baseSepolia } from "wagmi/chains"
import { baseAccount, injected } from "wagmi/connectors"

import { site } from "@/lib/site"

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [injected(), baseAccount({ appName: "Pwnpot" })],
  transports: {
    // Empty value falls back to publicnode (site.rpc, also named in the legal
    // notice): sepolia.base.org caps eth_getLogs at 200 blocks, publicnode at
    // 50 000 (see usePlatformEvents).
    [baseSepolia.id]: http(
      process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || site.rpc.url
    ),
  },
  ssr: true,
})

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig
  }
}

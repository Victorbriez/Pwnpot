"use client"

import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider } from "wagmi"

import { wagmiConfig } from "@/lib/onchain/wagmi"

function Web3Provider({ children }: { children: React.ReactNode }) {
  // One client per browser session, not shared across server requests.
  const [queryClient] = React.useState(() => new QueryClient())

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}

export { Web3Provider }

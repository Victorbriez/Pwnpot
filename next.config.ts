import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // The Base Account SDK only runs in the browser (wagmi imports it lazily on
  // connect). Its Node entry pulls optional @x402/* peers we don't install, so
  // keep it out of the server bundle.
  serverExternalPackages: ["@base-org/account"],
}

export default nextConfig

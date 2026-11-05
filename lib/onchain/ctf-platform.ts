import { isAddress, type Address } from "viem"

import { site } from "@/lib/site"

export { ctfPlatformAbi } from "@/lib/onchain/ctf-platform-abi"

/** Adresse du contrat ; `undefined` tant qu'il n'est pas déployé (mode démo). */
export const ctfPlatformAddress: Address | undefined =
  site.platformAddress && isAddress(site.platformAddress)
    ? site.platformAddress
    : undefined

/** Bloc de déploiement : point de départ de la lecture des events. */
export const ctfPlatformDeployBlock = BigInt(
  process.env.NEXT_PUBLIC_CTF_PLATFORM_DEPLOY_BLOCK || "0"
)

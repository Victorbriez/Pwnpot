import type { Address } from "viem"

/** Infos du site affichées dans le footer et les mentions légales. */
export const site = {
  name: "Pwnpot",
  year: 2026,
  editor: {
    name: "Victor Briez",
    // À compléter : affichés seulement une fois renseignés.
    school: null as string | null,
    contact: null as string | null,
  },
  host: {
    name: "Vercel Inc.",
    address: "440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
    url: "https://vercel.com",
    privacyUrl: "https://vercel.com/legal/privacy-policy",
  },
  platformAddress: (process.env.NEXT_PUBLIC_CTF_PLATFORM_ADDRESS ||
    null) as Address | null,
  links: {
    explorer: "https://sepolia.basescan.org",
    faucet: "https://docs.base.org/base-chain/tools/network-faucets",
    erc792: "https://github.com/ethereum/EIPs/issues/792",
  },
}

export function explorerAddressUrl(address: Address) {
  return `${site.links.explorer}/address/${address}`
}

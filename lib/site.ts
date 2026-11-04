import type { Address } from "viem"

/** Infos du site affichées dans le footer et les mentions légales. */
export const site = {
  name: "Pwnpot",
  /**
   * URL publique, pour les liens absolus (aperçus de partage, sitemap).
   * Sur Vercel, l'URL de prod est fournie au build ; sinon on tombe sur le local.
   */
  url: process.env.NEXT_PUBLIC_SITE_URL
    ? process.env.NEXT_PUBLIC_SITE_URL
    : process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000",
  year: 2026,
  /** Date affichée en tête des mentions légales et des CGU. */
  legalUpdatedAt: "4 novembre 2026",
  editor: {
    name: "Victor Briez",
    school: "Epitech",
    module: "Blockchain & Decentralised Applications",
    publicationDirector: "Victor Briez",
    // Facultatif pour un éditeur non professionnel (LCEN, art. 6-III-2) :
    // affiché seulement s'il est renseigné.
    contact: null as string | null,
  },
  host: {
    name: "Vercel Inc.",
    address: "440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
    url: "https://vercel.com",
    privacyUrl: "https://vercel.com/legal/privacy-policy",
  },
  /** Nœud RPC utilisé par défaut quand NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL est vide. */
  rpc: {
    name: "Coinbase, qui opère le réseau Base",
    url: "https://sepolia.base.org",
    privacyUrl: "https://www.coinbase.com/legal/privacy",
  },
  platformAddress: (process.env.NEXT_PUBLIC_CTF_PLATFORM_ADDRESS ||
    null) as Address | null,
  links: {
    explorer: "https://sepolia.basescan.org",
    faucet: "https://docs.base.org/base-chain/tools/network-faucets",
    erc792: "https://github.com/ethereum/EIPs/issues/792",
    cnil: "https://www.cnil.fr/fr/plaintes",
  },
}

export function explorerAddressUrl(address: Address) {
  return `${site.links.explorer}/address/${address}`
}

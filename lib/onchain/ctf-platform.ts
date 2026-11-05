// ABI provisoire de CTFPlatform, écrit à la main depuis l'interface cible de
// docs/DESIGN.md. À remplacer par l'ABI généré quand le contrat compile.
import { isAddress, type Address } from "viem"

import { site } from "@/lib/site"

/** Adresse du contrat ; `undefined` tant qu'il n'est pas déployé (mode démo). */
export const ctfPlatformAddress: Address | undefined =
  site.platformAddress && isAddress(site.platformAddress)
    ? site.platformAddress
    : undefined

export const ctfPlatformAbi = [
  {
    type: "function",
    name: "createCTF",
    stateMutability: "payable",
    inputs: [
      {
        name: "p",
        type: "tuple",
        internalType: "struct CTFParams",
        components: [
          { name: "cashPrize", type: "uint256" },
          { name: "ticketPrice", type: "uint256" },
          { name: "maxPlayers", type: "uint32" },
          { name: "organizerBond", type: "uint256" },
          { name: "startTime", type: "uint64" },
          { name: "endTime", type: "uint64" },
        ],
      },
      { name: "factories", type: "address[]" },
    ],
    outputs: [{ name: "ctfId", type: "uint256" }],
  },
  {
    type: "event",
    name: "CTFCreated",
    anonymous: false,
    inputs: [
      { name: "ctfId", type: "uint256", indexed: true },
      { name: "organizer", type: "address", indexed: true },
    ],
  },
] as const

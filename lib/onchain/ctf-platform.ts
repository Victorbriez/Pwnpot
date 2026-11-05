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
    type: "function",
    name: "buyTicket",
    stateMutability: "payable",
    inputs: [{ name: "ctfId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "createInstance",
    stateMutability: "nonpayable",
    inputs: [
      { name: "ctfId", type: "uint256" },
      { name: "levelIndex", type: "uint256" },
    ],
    outputs: [{ name: "instance", type: "address" }],
  },
  {
    type: "function",
    name: "submit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "ctfId", type: "uint256" },
      { name: "levelIndex", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "openDispute",
    stateMutability: "payable",
    inputs: [{ name: "ctfId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "vote",
    stateMutability: "nonpayable",
    inputs: [
      { name: "ctfId", type: "uint256" },
      { name: "cheated", type: "bool" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "appeal",
    stateMutability: "payable",
    inputs: [{ name: "ctfId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "finalize",
    stateMutability: "nonpayable",
    inputs: [{ name: "ctfId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "owed",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
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
  {
    type: "event",
    name: "InstanceCreated",
    anonymous: false,
    inputs: [
      { name: "ctfId", type: "uint256", indexed: true },
      { name: "levelIndex", type: "uint256", indexed: false },
      { name: "player", type: "address", indexed: true },
      { name: "instance", type: "address", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Withdrawn",
    anonymous: false,
    inputs: [
      { name: "to", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "DisputeOpened",
    anonymous: false,
    inputs: [
      { name: "ctfId", type: "uint256", indexed: true },
      { name: "contester", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "Voted",
    anonymous: false,
    inputs: [
      { name: "ctfId", type: "uint256", indexed: true },
      { name: "voter", type: "address", indexed: true },
      { name: "cheated", type: "bool", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Appealed",
    anonymous: false,
    inputs: [
      { name: "ctfId", type: "uint256", indexed: true },
      { name: "disputeID", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Ruled",
    anonymous: false,
    inputs: [
      { name: "ctfId", type: "uint256", indexed: true },
      { name: "cheated", type: "bool", indexed: false },
    ],
  },
] as const

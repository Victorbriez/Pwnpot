// Historique fictif des retraits du joueur de démo (event `Withdrawn`).
import { parseEther, type Hash } from "viem"

export type Withdrawal = {
  amount: bigint
  /** Date ISO du bloc. */
  date: string
  hash: Hash
}

export const withdrawals: Withdrawal[] = [
  {
    amount: parseEther("0.12"),
    date: "2026-10-18T19:42:00Z",
    hash: "0x5b1f0c7e9a2d4b6f8e0a1c3e5b7d9f1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d",
  },
  {
    amount: parseEther("0.03"),
    date: "2026-09-27T08:15:00Z",
    hash: "0x9e3c1a7f5b2d8e4a6c0f2b4d6e8a0c2e4b6d8f0a2c4e6b8d0f2a4c6e8b0d2f4a",
  },
]

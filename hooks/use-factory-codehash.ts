"use client"

import { keccak256, type Address, type Hex } from "viem"
import { baseSepolia } from "viem/chains"
import { useBytecode } from "wagmi"

export type CodehashCheck =
  | { status: "pending" }
  | { status: "error" }
  /** Le code actuel de la factory a la même empreinte que celle enregistrée. */
  | { status: "same" }
  /** Le code a changé depuis la création du CTF (ou l'adresse n'a plus de code). */
  | { status: "changed"; current: Hex | undefined }

/**
 * Compare le `codehash` enregistré par `CTFPlatform` à la création du CTF avec
 * l'empreinte du code que la factory a aujourd'hui (`keccak256` du bytecode,
 * comme `EXTCODEHASH`).
 */
export function useFactoryCodehash(
  factory: Address | undefined,
  recorded: Hex | undefined
): CodehashCheck {
  const code = useBytecode({
    address: factory,
    chainId: baseSepolia.id,
    query: {
      enabled: factory !== undefined && recorded !== undefined,
      staleTime: 30 * 60_000,
    },
  })
  if (code.isError) return { status: "error" }
  if (code.isPending) return { status: "pending" }
  const current = code.data ? keccak256(code.data) : undefined
  return current?.toLowerCase() === recorded?.toLowerCase()
    ? { status: "same" }
    : { status: "changed", current }
}

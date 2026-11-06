"use client"

import { useQuery } from "@tanstack/react-query"
import { type Address } from "viem"

import {
  canCheckVerification,
  fetchFactoryVerification,
} from "@/lib/onchain/sourcify"

/** État de vérification du code d'une factory (Sourcify). */
export function useFactoryVerification(address: Address | undefined) {
  return useQuery({
    queryKey: ["factory-verification", address?.toLowerCase()],
    queryFn: ({ signal }) => fetchFactoryVerification(address!, signal),
    enabled: canCheckVerification && address !== undefined,
    // Le code d'une adresse ne change pas (hors proxy, signalé à part).
    staleTime: 30 * 60_000,
    retry: 1,
  })
}

"use client"

import { useCtf } from "@/hooks/use-ctfs"

/** Titre d'un CTF lu dans le contrat (ou les mocks), pour l'en-tête. */
export function CtfTitle({ id }: { id: number }) {
  const { ctf } = useCtf(id)
  return <>{ctf?.title ?? `CTF n° ${id}`}</>
}

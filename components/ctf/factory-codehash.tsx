"use client"

import { CircleAlertIcon, FingerprintIcon } from "lucide-react"
import { type Address, type Hex } from "viem"

import { useFactoryCodehash } from "@/hooks/use-factory-codehash"

const short = (hash: Hex) => `${hash.slice(0, 10)}…${hash.slice(-6)}`

/**
 * Empreinte du code d'une factory (`codehash`), enregistrée par CTFPlatform à
 * la création du CTF, comparée au code actuel. Si elles diffèrent, la factory
 * n'est plus celle que l'organisateur a publiée.
 */
export function FactoryCodehash({
  factory,
  recorded,
}: {
  factory: Address
  recorded: Hex
}) {
  const check = useFactoryCodehash(factory, recorded)

  return (
    <p
      className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground"
      title={`Empreinte du code (codehash) enregistrée par CTFPlatform à la création du CTF : ${recorded}`}
    >
      <FingerprintIcon aria-hidden className="size-3.5 shrink-0" />
      <span>Empreinte du code</span>
      <code className="font-mono text-foreground">{short(recorded)}</code>
      {check.status === "same" && (
        <span className="text-success-text">· identique au code actuel</span>
      )}
      {check.status === "changed" && (
        <span className="inline-flex items-center gap-1 font-medium text-warning-text">
          <CircleAlertIcon aria-hidden className="size-3.5" />
          différente du code actuel
          {check.current ? ` (${short(check.current)})` : " (plus de code)"}
        </span>
      )}
      {check.status === "error" && <span>· code actuel illisible</span>}
    </p>
  )
}

"use client"

import Link from "next/link"
import {
  BadgeCheckIcon,
  CircleHelpIcon,
  ShieldAlertIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { type Address } from "viem"
import { baseSepolia } from "viem/chains"

import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import {
  useFactoryVerification,
  useVaultVerification,
} from "@/hooks/use-factory-verification"
import { blockscoutCodeUrl, canCheckVerification } from "@/lib/onchain/sourcify"

const explorer = baseSepolia.blockExplorers.default.url
/** Code du Coffre, affiché sur le site (app/(app)/code/vault). */
const VAULT_SOURCE_PATH = "/code/vault"

/**
 * Badge « code vérifié » d'une factory, avec un lien vers son code (Blockscout si vérifié, Basescan sinon).
 * Les factories sont écrites par les organisateurs : le joueur doit pouvoir
 * lire le code avant de payer son ticket (docs/SECURITY.md).
 */
export function FactoryVerificationBadge({
  factory,
  matchedByCode = false,
}: {
  factory: Address
  /**
   * Coffre déployé par l'organisateur : son code est comparé octet par octet
   * à VaultFactory (hors `immutable`), puis vérifié sur Sourcify depuis le site.
   */
  matchedByCode?: boolean
}) {
  if (matchedByCode) return <VaultBadge vault={factory} />
  return <SourcifyBadge factory={factory} />
}

/**
 * Coffre déployé par l'organisateur. Vérifié par Sourcify (envoyé à la
 * création, ou à la première visite) : « Code vérifié », lien vers Blockscout.
 * En attendant, ou si Sourcify ne répond pas : « Code Pwnpot », reconnu octet
 * par octet, lien vers la source sur le site.
 */
function VaultBadge({ vault }: { vault: Address }) {
  const { verified, verifying } = useVaultVerification(vault)

  if (verified)
    return (
      <Badge
        variant="success"
        render={
          <a href={blockscoutCodeUrl(vault)} target="_blank" rel="noreferrer" />
        }
        title="Coffre déployé par l'organisateur pour ce CTF, code source vérifié par Sourcify. Lis-le sur Blockscout."
      >
        <BadgeCheckIcon data-icon="inline-start" />
        Code vérifié
      </Badge>
    )

  return (
    <Badge
      variant="success"
      render={<Link href={VAULT_SOURCE_PATH} />}
      title={
        verifying
          ? "Vérification du code sur Sourcify en cours. En attendant : code identique à la VaultFactory de Pwnpot, lis la source sur le site."
          : "Code identique à la VaultFactory de Pwnpot, déployé par l'organisateur pour ce CTF. Lis la source sur le site."
      }
    >
      {verifying ? (
        <Spinner data-icon="inline-start" />
      ) : (
        <BadgeCheckIcon data-icon="inline-start" />
      )}
      Code Pwnpot
    </Badge>
  )
}

/** Factory partagée ou inconnue : état publié par Sourcify. Code vérifié : lien vers Blockscout, qui le reprend (Basescan non). */
function SourcifyBadge({ factory }: { factory: Address }) {
  const { data, isPending, isError } = useFactoryVerification(factory)

  if (!canCheckVerification) return null

  const link = (hash = "") => (
    <a
      href={`${explorer}/address/${factory}${hash}`}
      target="_blank"
      rel="noreferrer"
    />
  )

  if (isPending)
    return (
      <Badge variant="muted">
        <Spinner data-icon="inline-start" />
        Vérification du code
      </Badge>
    )

  if (isError)
    return (
      <Badge
        variant="muted"
        render={link()}
        title="Sourcify ne répond pas. Vérifie le code de la factory sur Basescan avant de jouer."
      >
        <CircleHelpIcon data-icon="inline-start" />
        Vérification indisponible
      </Badge>
    )

  switch (data.status) {
    case "verified":
      return (
        <Badge
          variant="success"
          render={
            <a
              href={blockscoutCodeUrl(factory)}
              target="_blank"
              rel="noreferrer"
            />
          }
          title={`Code source publié${data.name ? ` (${data.name})` : ""} et identique au contrat déployé, vérifié par Sourcify. Lis-le sur Blockscout.`}
        >
          <BadgeCheckIcon data-icon="inline-start" />
          Code vérifié
        </Badge>
      )
    case "proxy":
      return (
        <Badge
          variant="warning"
          render={link("#code")}
          title="Cette factory est un proxy : son code peut être changé après la création du CTF."
        >
          <ShieldAlertIcon data-icon="inline-start" />
          Proxy : code modifiable
        </Badge>
      )
    case "unverified":
      return (
        <Badge
          variant="warning"
          render={link()}
          title="Aucun code source publié : impossible de lire ce que fait cette factory avant de payer."
        >
          <TriangleAlertIcon data-icon="inline-start" />
          Code non vérifié
        </Badge>
      )
  }
}

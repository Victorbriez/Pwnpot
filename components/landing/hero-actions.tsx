"use client"

import Link from "next/link"
import { useConnection } from "wagmi"

import { buttonVariants } from "@/components/ui/button"
import { ConnectWallet } from "@/components/ui/connect-wallet"

/**
 * Sans wallet : on invite à se connecter (la connexion mène à /explore),
 * avec un accès en lecture seule à côté. Connecté : on va droit aux CTF.
 */
export function HeroActions() {
  const { isConnected } = useConnection()

  if (isConnected) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/explore" className={buttonVariants({ size: "lg" })}>
          Explorer les CTF
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <ConnectWallet
        label="Connecter mon wallet"
        className="h-9 border-transparent bg-primary px-3 text-sm text-primary-foreground hover:bg-primary/80"
      />
      <Link
        href="/explore"
        className={buttonVariants({ variant: "outline", size: "lg" })}
      >
        Voir les CTF sans wallet
      </Link>
    </div>
  )
}

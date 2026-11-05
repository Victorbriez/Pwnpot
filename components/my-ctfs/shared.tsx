"use client"

import Link from "next/link"
import { WalletIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { ConnectWallet } from "@/components/ui/connect-wallet"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import type { NextStep } from "@/lib/ctf/next-step"

const toneVariant = {
  neutral: "muted",
  action: "brand",
  warning: "warning",
  money: "success",
} as const satisfies Record<NextStep["tone"], string>

/** Prochaine action à faire sur un CTF. */
export function NextStepBadge({ step }: { step: NextStep }) {
  return (
    <Badge variant={toneVariant[step.tone]} className="h-7 px-3">
      {step.label}
    </Badge>
  )
}

/** Contrat déployé mais aucun wallet : rien à lire sans adresse. */
export function WalletGate() {
  return (
    <Empty className="rounded-2xl border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <WalletIcon />
        </EmptyMedia>
        <EmptyTitle>Connecte ton wallet</EmptyTitle>
        <EmptyDescription>
          Tes CTF sont lus depuis la chaîne, à partir de ton adresse.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <ConnectWallet />
      </EmptyContent>
    </Empty>
  )
}

export function EmptyList({
  icon,
  title,
  description,
  href,
  cta,
}: {
  icon: React.ReactNode
  title: string
  description: string
  href: string
  cta: string
}) {
  return (
    <Empty className="rounded-2xl border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Link href={href} className={buttonVariants({ variant: "outline" })}>
          {cta}
        </Link>
      </EmptyContent>
    </Empty>
  )
}

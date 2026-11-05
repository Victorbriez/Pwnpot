import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"

import { remainingLabel } from "@/components/ctf/ctf-card"
import { CtfPlay } from "@/components/ctf/ctf-play"
import { StatusPill } from "@/components/ctf/status-pill"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { ctfs } from "@/lib/mock/explore"

function findCtf(id: string) {
  return ctfs.find((ctf) => String(ctf.id) === id)
}

export function generateStaticParams() {
  return ctfs.map((ctf) => ({ id: String(ctf.id) }))
}

export async function generateMetadata({
  params,
}: PageProps<"/ctf/[id]">): Promise<Metadata> {
  const ctf = findCtf((await params).id)
  return ctf
    ? {
        title: ctf.title,
        description: `${ctf.challenges} épreuve${ctf.challenges > 1 ? "s" : ""} de sécurité smart contract, cagnotte garantie par le contrat.`,
      }
    : {}
}

export default async function CtfPage({ params }: PageProps<"/ctf/[id]">) {
  const ctf = findCtf((await params).id)
  if (!ctf) notFound()

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-12">
      <header className="flex flex-col gap-4">
        <Link
          href="/explore"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "-ml-2 w-fit text-muted-foreground",
          })}
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Explorer
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill status={ctf.status} />
          <span className="font-mono text-sm text-muted-foreground tabular-nums">
            {remainingLabel(ctf)}
          </span>
          <Badge variant="warning" className="h-6 px-2.5">
            Données de démonstration
          </Badge>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {ctf.title}
        </h1>
      </header>
      <CtfPlay ctfId={ctf.id} />
    </div>
  )
}

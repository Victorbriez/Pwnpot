import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { CtfPlay } from "@/components/ctf/ctf-play"
import { CtfTitle } from "@/components/ctf/ctf-title"
import { PageShell } from "@/components/site/page-header"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ctfs } from "@/lib/mock/explore"
import { ctfPlatformAddress } from "@/lib/onchain/ctf-platform"

const isDemo = ctfPlatformAddress === undefined

function findDemoCtf(id: string) {
  return ctfs.find((ctf) => String(ctf.id) === id)
}

/** Numéro de CTF valide (entier ≥ 0), sinon `undefined`. */
function parseId(id: string) {
  return /^\d+$/.test(id) ? Number(id) : undefined
}

// En démo, les pages des CTF fictifs sont générées au build. Avec le contrat,
// les CTF sont créés à tout moment : la page est rendue à la demande.
export function generateStaticParams() {
  return isDemo ? ctfs.map((ctf) => ({ id: String(ctf.id) })) : []
}

export async function generateMetadata({
  params,
}: PageProps<"/ctf/[id]">): Promise<Metadata> {
  const { id } = await params
  if (!isDemo) return { title: `CTF n° ${id}` }
  const ctf = findDemoCtf(id)
  return ctf
    ? {
        title: ctf.title,
        description: `${ctf.challenges} épreuve${ctf.challenges > 1 ? "s" : ""} de sécurité smart contract, cagnotte garantie par le contrat.`,
      }
    : {}
}

export default async function CtfPage({ params }: PageProps<"/ctf/[id]">) {
  const { id: raw } = await params
  const id = parseId(raw)
  if (id === undefined || (isDemo && !findDemoCtf(raw))) notFound()

  return (
    <PageShell className="gap-6">
      {/* Le titre et l'état du CTF sont lus dans la chaîne : CtfPlay les affiche. */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/explore" />}>
              Explorer
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              <CtfTitle id={id} />
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <CtfPlay ctfId={id} />
    </PageShell>
  )
}

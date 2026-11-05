import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { CtfPlay } from "@/components/ctf/ctf-play"
import { PageHeader, PageShell } from "@/components/site/page-header"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
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
    <PageShell>
      <PageHeader
        breadcrumb={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/explore" />}>
                  Explorer
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{ctf.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
        title={ctf.title}
      />
      <CtfPlay ctfId={ctf.id} />
    </PageShell>
  )
}

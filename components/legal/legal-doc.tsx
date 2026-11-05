import Link from "next/link"

import { PageHeader, PageShell } from "@/components/site/page-header"
import type { TocSection } from "@/components/site/page-toc"
import { ProseSection } from "@/components/site/prose-section"
import { TocLayout } from "@/components/site/toc-layout"

/** Mise en page commune des pages juridiques (mentions légales, CGU). */
export function LegalDoc({
  title,
  intro,
  sections,
  children,
}: {
  title: string
  intro: React.ReactNode
  sections: TocSection[]
  children: React.ReactNode
}) {
  return (
    <PageShell wide>
      <PageHeader title={title} description={intro} />
      <TocLayout sections={sections}>{children}</TocLayout>
    </PageShell>
  )
}

export function LegalSection(props: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return <ProseSection {...props} />
}

const linkClass = "font-medium text-foreground underline underline-offset-4"

export function ExternalLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={linkClass}>
      {children}
      <span className="sr-only"> (nouvel onglet)</span>
    </a>
  )
}

export function InternalLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link href={href} className={linkClass}>
      {children}
    </Link>
  )
}

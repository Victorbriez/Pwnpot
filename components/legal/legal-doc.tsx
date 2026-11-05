import { PageHeader, PageShell } from "@/components/site/page-header"
import type { TocSection } from "@/components/site/page-toc"
import { ProseSection } from "@/components/site/prose-section"
import { TextLink } from "@/components/site/text-link"
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

/** Lien vers un site externe, dans un nouvel onglet. */
export function ExternalLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return <TextLink href={href}>{children}</TextLink>
}

/** Lien vers une page du site. */
export function InternalLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return <TextLink href={href}>{children}</TextLink>
}

import Link from "next/link"

import { PageToc, type TocSection } from "@/components/site/page-toc"

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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-12 lg:py-24">
      <header className="flex max-w-2xl flex-col gap-3 lg:ml-[calc(14rem+5rem)]">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          {title}
        </h1>
        <div className="text-pretty text-muted-foreground">{intro}</div>
      </header>
      <div className="grid gap-10 lg:grid-cols-[14rem_minmax(0,42rem)] lg:gap-20">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <PageToc sections={sections} />
        </aside>
        <article className="flex min-w-0 flex-col gap-10">{children}</article>
      </div>
    </div>
  )
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-titre`}
      className="flex scroll-mt-24 flex-col gap-4 border-t pt-10"
    >
      <h2 id={`${id}-titre`} className="text-2xl font-semibold tracking-tight">
        {title}
      </h2>
      <div className="flex flex-col gap-4 leading-7 text-pretty text-muted-foreground [&_h3]:pt-2 [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:pl-1 [&_strong]:font-medium [&_strong]:text-foreground [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  )
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

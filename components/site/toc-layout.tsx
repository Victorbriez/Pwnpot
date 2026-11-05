import { PageToc, type TocSection } from "@/components/site/page-toc"

/** Page de texte long : sommaire collant à gauche, texte en largeur de lecture. */
export function TocLayout({
  sections,
  children,
}: {
  sections: readonly TocSection[]
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <PageToc sections={sections} />
      </aside>
      <div className="flex max-w-3xl min-w-0 flex-col gap-12">{children}</div>
    </div>
  )
}

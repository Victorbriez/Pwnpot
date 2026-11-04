import Link from "next/link"

/** Mise en page commune des pages juridiques (mentions légales, CGU). */
export function LegalDoc({
  title,
  intro,
  sections,
  children,
}: {
  title: string
  intro: React.ReactNode
  sections: { id: string; label: string }[]
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[14rem_minmax(0,42rem)] lg:gap-20 lg:px-12 lg:py-24">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <nav aria-label="Sur cette page" className="hidden lg:block">
          <ul className="flex flex-col gap-2.5 text-sm">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <article className="flex min-w-0 flex-col gap-10">
        <header className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            {title}
          </h1>
          <div className="text-pretty text-muted-foreground">{intro}</div>
        </header>
        {children}
      </article>
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

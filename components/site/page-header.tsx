import { cn } from "@/lib/utils"

/** Conteneur de page : même largeur et mêmes marges partout. */
export function PageShell({
  wide = false,
  className,
  children,
}: {
  /** Explore a besoin de plus de place pour sa grille de cartes. */
  wide?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-col gap-8 px-4 py-10 sm:px-6 lg:px-12 lg:py-12",
        wide ? "max-w-7xl" : "max-w-6xl",
        className
      )}
    >
      {children}
    </div>
  )
}

/** En-tête de page : fil d'Ariane, pastilles, titre, description, actions. */
export function PageHeader({
  title,
  description,
  breadcrumb,
  meta,
  actions,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  breadcrumb?: React.ReactNode
  meta?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <header className="flex flex-col gap-4">
      {breadcrumb}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-2xl min-w-0 flex-1 flex-col gap-3">
          {meta && (
            <div className="flex flex-wrap items-center gap-2">{meta}</div>
          )}
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="text-pretty text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>
        )}
      </div>
    </header>
  )
}

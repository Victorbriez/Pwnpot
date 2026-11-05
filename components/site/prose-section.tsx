import { cn } from "@/lib/utils"

/**
 * Section d'une page de texte long (doc, mentions légales, CGU) : titre
 * ancré (#) qu'on peut copier, chapeau facultatif, puis le contenu. Les
 * paragraphes, listes et sous-titres posés directement dedans sont stylés.
 */
export function ProseSection({
  id,
  title,
  lead,
  className,
  children,
}: {
  id: string
  title: string
  lead?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-titre`}
      className={cn(
        "flex scroll-mt-24 flex-col gap-5 border-t pt-10 first:border-t-0 first:pt-0",
        className
      )}
    >
      <div className="flex flex-col gap-2">
        <h2
          id={`${id}-titre`}
          className="group text-2xl font-semibold tracking-tight text-balance"
        >
          {title}
          <a
            href={`#${id}`}
            aria-label={`Lien vers « ${title} »`}
            className="ml-2 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          >
            #
          </a>
        </h2>
        {lead && <p className="text-pretty text-muted-foreground">{lead}</p>}
      </div>
      <div className="flex flex-col gap-4 [&_li]:pl-1 [&_strong]:font-medium [&_strong]:text-foreground [&>h3]:pt-2 [&>h3]:text-lg [&>h3]:font-semibold [&>p]:leading-7 [&>p]:text-pretty [&>p]:text-muted-foreground [&>ul]:flex [&>ul]:list-disc [&>ul]:flex-col [&>ul]:gap-2 [&>ul]:pl-5 [&>ul]:leading-7 [&>ul]:text-muted-foreground">
        {children}
      </div>
    </section>
  )
}

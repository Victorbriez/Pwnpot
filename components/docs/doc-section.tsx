import { LightbulbIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/** Sections de la doc, dans l'ordre : sert au sommaire et aux ancres. */
export const docSections = [
  { id: "principe", label: "Le principe" },
  { id: "jouer", label: "Jouer" },
  { id: "organiser", label: "Organiser" },
  { id: "cycle-de-vie", label: "Cycle de vie" },
  { id: "argent", label: "Où va l'argent" },
  { id: "litiges", label: "Litiges et appel" },
  { id: "epreuves", label: "Les épreuves" },
  { id: "securite", label: "Sécurité et limites" },
  { id: "parametres", label: "Paramètres" },
  { id: "faq", label: "Questions fréquentes" },
] as const

export type DocSectionId = (typeof docSections)[number]["id"]

/** Section avec un titre ancré (#) qu'on peut copier pour partager. */
export function DocSection({
  id,
  title,
  lead,
  children,
}: {
  id: DocSectionId
  title: string
  lead?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-titre`}
      className="flex scroll-mt-24 flex-col gap-5 border-t pt-10 first:border-t-0 first:pt-0"
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
      {children}
    </section>
  )
}

export function DocSubheading({ children }: { children: React.ReactNode }) {
  return <h3 className="pt-2 text-lg font-semibold">{children}</h3>
}

/** Paragraphe de doc : largeur de lecture et couleur atténuée. */
export function DocText({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <p className={cn("leading-7 text-pretty text-muted-foreground", className)}>
      {children}
    </p>
  )
}

export function DocList({ children }: { children: React.ReactNode }) {
  return (
    <ul className="flex list-disc flex-col gap-2 pl-5 leading-7 text-muted-foreground marker:text-muted-foreground/60">
      {children}
    </ul>
  )
}

/** Encadré « Exemple » avec des montants calculés par le code. */
export function DocExample({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <figure className="flex flex-col gap-3 rounded-xl border bg-muted/40 p-5">
      <figcaption className="flex items-center gap-2 text-sm font-semibold">
        <LightbulbIcon className="size-4 text-primary" aria-hidden />
        Exemple · {title}
      </figcaption>
      <div className="flex flex-col gap-3 text-sm leading-6 text-muted-foreground">
        {children}
      </div>
    </figure>
  )
}

/** Montant ou valeur mise en avant dans un texte. */
export function Num({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono font-medium text-foreground tabular-nums">
      {children}
    </span>
  )
}

/** Nom de fonction ou de variable du contrat. */
export function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
      {children}
    </code>
  )
}

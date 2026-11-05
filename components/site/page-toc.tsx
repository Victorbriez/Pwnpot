"use client"

import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

export type TocSection = { id: string; label: string }

/** Hauteur de l'en-tête collant, plus un peu de marge. */
const HEADER_OFFSET = 120

/**
 * Sommaire d'une longue page (doc, mentions légales, CGU) : surligne la
 * section en cours de lecture. À placer dans une colonne collante.
 */
export function PageToc({
  sections,
  className,
}: {
  sections: readonly TocSection[]
  className?: string
}) {
  const [active, setActive] = useState<string | undefined>(sections[0]?.id)

  useEffect(() => {
    // Section en cours : la dernière dont le haut est passé sous l'en-tête.
    // En bas de page, la dernière section ne remonte jamais jusque-là : on
    // l'allume dès qu'on ne peut plus descendre.
    const update = () => {
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 4
      if (atBottom) {
        setActive(sections.at(-1)?.id)
        return
      }
      let current = sections[0]?.id
      for (const section of sections) {
        const el = document.getElementById(section.id)
        if (el && el.getBoundingClientRect().top <= HEADER_OFFSET) {
          current = section.id
        }
      }
      setActive(current)
    }

    let frame = 0
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [sections])

  return (
    <nav
      aria-label="Sommaire"
      className={cn("rounded-xl border p-4 lg:border-0 lg:p-0", className)}
    >
      <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Sommaire
      </p>
      <ol className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3 lg:grid-cols-1">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              aria-current={active === section.id ? "location" : undefined}
              className={cn(
                "block border-l-2 border-transparent py-1 pl-3 text-muted-foreground transition-colors hover:text-foreground",
                "aria-[current=location]:border-primary aria-[current=location]:font-medium aria-[current=location]:text-foreground"
              )}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

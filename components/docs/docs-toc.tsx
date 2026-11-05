"use client"

import { useEffect, useState } from "react"

import { docSections, type DocSectionId } from "@/components/docs/doc-section"
import { cn } from "@/lib/utils"

/** Sommaire de la doc : surligne la section en cours de lecture. */
export function DocsToc({ className }: { className?: string }) {
  const [active, setActive] = useState<DocSectionId>(docSections[0].id)

  useEffect(() => {
    const elements = docSections
      .map((section) => document.getElementById(section.id))
      .filter((el): el is HTMLElement => el !== null)

    // Une section est « en cours » quand son haut passe sous l'en-tête.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id as DocSectionId)
      },
      { rootMargin: "-96px 0px -65% 0px" }
    )
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <nav aria-label="Sommaire" className={className}>
      <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Sommaire
      </p>
      <ol className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3 lg:grid-cols-1">
        {docSections.map((section) => (
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

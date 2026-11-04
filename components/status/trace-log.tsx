"use client"

import { RotateCcwIcon } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type TraceLevel = "TX" | "SYS" | "ERR" | "OK"
export type TraceLine = { level: TraceLevel; message: string }

const levelClass: Record<TraceLevel, string> = {
  TX: "text-info-text",
  SYS: "text-muted-foreground",
  ERR: "text-destructive",
  OK: "text-success-text",
}

const STEP_MS = 420

const reveal =
  "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300 motion-safe:fill-mode-backwards"

/**
 * Terminal des pages d'erreur, sur le gabarit de exploit.log : lignes révélées
 * une à une, tampon de travers sur le coin, résumé en bas.
 */
export function TraceLog({
  title,
  label,
  stamp,
  lines,
  summary,
  className,
}: {
  title: string
  label: string
  stamp: string
  lines: TraceLine[]
  summary: { label: string; value: string }
  className?: string
}) {
  // Changer la clé remonte la liste et relance les animations CSS.
  const [run, setRun] = React.useState(0)

  return (
    <div className={cn("relative", className)}>
      <span
        key={`stamp-${run}`}
        aria-hidden
        className="absolute -top-5 -right-2 z-10 rotate-[-11deg] rounded-md border-2 border-destructive bg-background/80 px-3 py-1 font-mono text-sm font-bold tracking-[0.25em] text-destructive uppercase shadow-lg backdrop-blur-sm motion-safe:animate-in motion-safe:duration-200 motion-safe:fill-mode-backwards motion-safe:fade-in motion-safe:zoom-in-150 sm:-right-5 sm:text-base"
        style={{ animationDelay: `${(lines.length + 1) * STEP_MS}ms` }}
      >
        {stamp}
      </span>

      <figure className="flex rotate-[1.5deg] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-destructive/10 transition-transform duration-500 hover:rotate-0 motion-reduce:rotate-0">
        <div className="flex items-center gap-3 border-b px-5 py-3">
          <span className="flex gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-destructive/70" />
            <span className="size-2.5 rounded-full bg-accent" />
            <span className="size-2.5 rounded-full bg-accent" />
          </span>
          <figcaption className="font-mono text-xs text-muted-foreground">
            {title}
          </figcaption>
          <Button
            variant="ghost"
            size="icon-sm"
            className="ml-auto"
            aria-label="Rejouer la trace"
            onClick={() => setRun((value) => value + 1)}
          >
            <RotateCcwIcon />
          </Button>
        </div>

        <ol
          key={run}
          aria-label={label}
          className="flex min-h-64 flex-col gap-2.5 px-5 py-5 font-mono text-[0.78rem] leading-5"
        >
          {lines.map((line, index) => (
            <li
              key={index}
              className={cn("grid grid-cols-[2.5rem_1fr] gap-x-3", reveal)}
              style={{ animationDelay: `${(index + 1) * STEP_MS}ms` }}
            >
              <span className={cn("font-medium", levelClass[line.level])}>
                {line.level}
              </span>
              <span
                className={cn(
                  "min-w-0 [overflow-wrap:anywhere]",
                  line.level === "ERR"
                    ? "text-destructive"
                    : "text-secondary-foreground"
                )}
              >
                {line.message}
              </span>
            </li>
          ))}
        </ol>

        <div
          key={`summary-${run}`}
          className={cn(
            "flex items-center justify-between gap-4 border-t bg-destructive/10 px-5 py-4",
            reveal
          )}
          style={{ animationDelay: `${(lines.length + 1.5) * STEP_MS}ms` }}
        >
          <span className="text-sm text-secondary-foreground">
            {summary.label}
          </span>
          <span className="font-mono text-lg font-semibold text-destructive tabular-nums">
            {summary.value}
          </span>
        </div>
      </figure>
    </div>
  )
}

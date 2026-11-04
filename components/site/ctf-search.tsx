"use client"

import { SearchIcon } from "lucide-react"
import * as React from "react"

import { StatusPill } from "@/components/ctf/status-pill"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Kbd } from "@/components/ui/kbd"
import { Button } from "@/components/ui/button"
import { formatEth } from "@/lib/format"
import { ctfs } from "@/lib/mock/explore"
import { cn } from "@/lib/utils"

/** Recherche de CTF, ouverte au clic ou avec ⌘K / Ctrl+K. */
export function CtfSearch({ className }: { className?: string }) {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <>
      <Button
        variant="outline"
        className={cn("justify-start text-muted-foreground", className)}
        onClick={() => setOpen(true)}
      >
        <SearchIcon data-icon="inline-start" />
        <span className="mr-6">Rechercher un CTF</span>
        <Kbd className="ml-auto">⌘K</Kbd>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Rechercher un CTF"
        description="Nom du CTF ou type de faille"
      >
        <Command>
          <CommandInput placeholder="Nom du CTF ou type de faille…" />
          <CommandList>
            <CommandEmpty>Aucun CTF ne correspond.</CommandEmpty>
            <CommandGroup heading="CTF">
              {ctfs.map((ctf) => (
                <CommandItem
                  key={ctf.id}
                  value={`${ctf.title} ${ctf.vulns.join(" ")}`}
                  onSelect={() => setOpen(false)}
                >
                  <span className="truncate">{ctf.title}</span>
                  <span className="ml-auto flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground tabular-nums">
                      {formatEth(ctf.prizePool)}
                    </span>
                    <StatusPill status={ctf.status} />
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}

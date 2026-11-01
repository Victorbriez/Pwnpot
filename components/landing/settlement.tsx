"use client"

import * as React from "react"
import { parseEther } from "viem"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { formatEth } from "@/lib/format"
import { cn } from "@/lib/utils"

// Exemple : un CTF avec 4 ETH de cagnotte, 142 tickets à 0,02 ETH, 1,5 ETH de caution.
const funds = [
  {
    key: "pot",
    label: "Cagnotte de l'organisateur",
    amount: parseEther("4"),
    tone: "bg-foreground/20",
  },
  {
    key: "tickets",
    label: "Tickets des joueurs",
    amount: parseEther("2.84"),
    tone: "bg-foreground/12",
  },
  {
    key: "bond",
    label: "Caution",
    amount: parseEther("1.5"),
    tone: "bg-foreground/6",
  },
] as const

const total = funds.reduce((sum, fund) => sum + fund.amount, BigInt(0))

type Destination = "winners" | "players" | "organizer" | "burn"

const destinationStyle: Record<Destination, string> = {
  winners: "bg-primary",
  players: "bg-info",
  organizer: "bg-success",
  burn: "bg-[repeating-linear-gradient(135deg,var(--destructive)_0_6px,transparent_6px_12px)] ring-1 ring-destructive/60 ring-inset",
}

const outcomes = {
  winners: {
    label: "Des gagnants",
    when: "Au moins un joueur a validé son instance avant la clôture.",
    flows: [
      {
        to: "winners",
        label: "Gagnants, cagnotte et tickets",
        amount: parseEther("6.84"),
      },
      {
        to: "organizer",
        label: "Organisateur, caution rendue",
        amount: parseEther("1.5"),
      },
    ],
  },
  none: {
    label: "Aucun gagnant",
    when: "Personne n'a cassé le contrat, et aucun litige n'a abouti.",
    flows: [
      {
        to: "players",
        label: "Joueurs, tickets remboursés",
        amount: parseEther("2.84"),
      },
      {
        to: "organizer",
        label: "Organisateur, cagnotte et caution",
        amount: parseEther("5.5"),
      },
    ],
  },
  cheat: {
    label: "Triche confirmée",
    when: "Un litige prouve que l'organisateur a triché : le vote, puis l'arbitre, l'ont confirmé.",
    flows: [
      {
        to: "players",
        label: "Joueurs, tickets remboursés",
        amount: parseEther("2.84"),
      },
      {
        to: "organizer",
        label: "Organisateur, cagnotte seulement",
        amount: parseEther("4"),
      },
      { to: "burn", label: "Caution brûlée", amount: parseEther("1.5") },
    ],
  },
} as const satisfies Record<
  string,
  {
    label: string
    when: string
    flows: ReadonlyArray<{ to: Destination; label: string; amount: bigint }>
  }
>

type Outcome = keyof typeof outcomes

function share(amount: bigint) {
  return `${(Number((amount * BigInt(10_000)) / total) / 100).toFixed(2)}%`
}

export function Settlement() {
  const [outcome, setOutcome] = React.useState<Outcome>("winners")
  const current = outcomes[outcome]

  return (
    <div className="flex flex-col gap-10">
      <ToggleGroup
        variant="outline"
        spacing={0}
        value={[outcome]}
        onValueChange={(value) => {
          const next = value[0] as Outcome | undefined
          if (next) setOutcome(next)
        }}
        aria-label="Issue du CTF"
        className="flex-wrap"
      >
        {Object.entries(outcomes).map(([key, { label }]) => (
          <ToggleGroupItem key={key} value={key} className="h-9 px-4">
            {label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <p
        className="-mt-6 text-sm text-pretty text-muted-foreground"
        aria-live="polite"
      >
        {current.when}
      </p>

      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4 text-sm">
          <span className="text-muted-foreground">
            Ce que détient le contrat
          </span>
          <span className="font-mono font-medium tabular-nums">
            {formatEth(total)}
          </span>
        </div>
        <div className="flex h-14 gap-1 overflow-hidden rounded-xl">
          {funds.map((fund) => (
            <div
              key={fund.key}
              style={{ width: share(fund.amount) }}
              className={cn(
                "flex min-w-0 flex-col justify-center px-3",
                fund.tone
              )}
            >
              <span className="hidden truncate text-xs text-muted-foreground sm:block">
                {fund.label}
              </span>
              <span className="hidden truncate font-mono text-sm tabular-nums sm:block">
                {formatEth(fund.amount)}
              </span>
            </div>
          ))}
        </div>
        <ul className="flex flex-col gap-1.5 text-xs sm:hidden">
          {funds.map((fund) => (
            <li key={fund.key} className="flex items-center gap-2">
              <span
                aria-hidden
                className={cn("size-2.5 rounded-[3px]", fund.tone)}
              />
              <span className="text-muted-foreground">{fund.label}</span>
              <span className="ml-auto font-mono tabular-nums">
                {formatEth(fund.amount)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-sm text-muted-foreground">
          Où il part à la clôture
        </span>
        <div className="flex h-14 gap-1 overflow-hidden rounded-xl" aria-hidden>
          {current.flows.map((flow) => (
            <div
              key={`${outcome}-${flow.to}`}
              style={{ width: share(flow.amount) }}
              className={cn(
                "animate-in duration-300 fade-in motion-reduce:animate-none",
                destinationStyle[flow.to]
              )}
            />
          ))}
        </div>
        <ul className="mt-2 flex flex-col divide-y border-y">
          {current.flows.map((flow) => (
            <li
              key={`${outcome}-${flow.to}`}
              className="flex items-center gap-3 py-3"
            >
              <span
                aria-hidden
                className={cn(
                  "size-3 shrink-0 rounded-[3px]",
                  destinationStyle[flow.to]
                )}
              />
              <span className="text-sm">{flow.label}</span>
              <span
                className={cn(
                  "ml-auto font-mono text-sm font-medium tabular-nums",
                  flow.to === "burn" && "text-destructive line-through"
                )}
              >
                {formatEth(flow.amount)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

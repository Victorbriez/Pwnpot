import { parseEther } from "viem"

import { formatEth } from "@/lib/format"
import { cn } from "@/lib/utils"

// Exemple tiré de docs/DESIGN.md : cash prize 0,4 ETH, ticket 0,05 ETH,
// 20 places dont 16 vendues, caution 1,4 ETH (= cash prize + 20 × ticket),
// caution de contestation 0,15 ETH (= 3 × ticket).
const funds = [
  {
    key: "prize",
    label: "Cash prize",
    amount: parseEther("0.4"),
    tone: "bg-foreground/20",
  },
  {
    key: "tickets",
    label: "Tickets des joueurs",
    amount: parseEther("0.8"),
    tone: "bg-foreground/12",
  },
  {
    key: "bond",
    label: "Caution de l'organisateur",
    amount: parseEther("1.4"),
    tone: "bg-foreground/6",
  },
  {
    key: "dispute",
    label: "Caution de contestation, si litige",
    amount: parseEther("0.15"),
    tone: "bg-[repeating-linear-gradient(135deg,var(--muted-foreground)_0_3px,transparent_3px_7px)] opacity-60",
  },
] as const

// Toutes les barres partagent la même échelle : le cas avec litige.
const total = funds.reduce((sum, fund) => sum + fund.amount, BigInt(0))

type Destination = "winners" | "players" | "contester" | "organizer" | "burn"

const destinations: Record<Destination, { label: string; tone: string }> = {
  winners: { label: "Gagnants", tone: "bg-primary" },
  players: { label: "Joueurs remboursés", tone: "bg-info" },
  contester: { label: "Contestataire", tone: "bg-warning" },
  organizer: { label: "Organisateur", tone: "bg-success" },
  burn: {
    label: "Brûlé",
    tone: "bg-[repeating-linear-gradient(135deg,var(--destructive)_0_6px,transparent_6px_12px)] ring-1 ring-destructive/60 ring-inset",
  },
}

const outcomes: {
  label: string
  when: string
  note?: string
  flows: { to: Destination; amount: bigint }[]
}[] = [
  {
    label: "Des gagnants",
    when: "Au moins une épreuve validée avant la deadline.",
    note: "Partage du podium 60 / 30 / 10 % (proposé).",
    flows: [
      { to: "winners", amount: parseEther("1.2") },
      { to: "organizer", amount: parseEther("1.4") },
    ],
  },
  {
    label: "Aucun gagnant",
    when: "Personne n'a validé d'épreuve.",
    note: "L'organisateur récupère sa mise, sans rien gagner.",
    flows: [
      { to: "players", amount: parseEther("0.8") },
      { to: "organizer", amount: parseEther("1.8") },
    ],
  },
  {
    label: "Litige rejeté",
    when: "Le vote, ou l'arbitre en appel, ne retient pas la triche.",
    note: "Le contestataire perd sa caution, versée à l'organisateur.",
    flows: [
      { to: "winners", amount: parseEther("1.2") },
      { to: "organizer", amount: parseEther("1.55") },
    ],
  },
  {
    label: "Triche confirmée",
    when: "Le litige retient la triche de l'organisateur.",
    note: "Le sort du cash prize est encore à trancher : ici, il est rendu.",
    flows: [
      { to: "players", amount: parseEther("0.8") },
      { to: "contester", amount: parseEther("0.15") },
      { to: "organizer", amount: parseEther("0.4") },
      { to: "burn", amount: parseEther("1.4") },
    ],
  },
]

function share(amount: bigint) {
  return `${(Number((amount * BigInt(10_000)) / total) / 100).toFixed(2)}%`
}

function describe(flows: { to: Destination; amount: bigint }[]) {
  return flows
    .map((flow) => `${destinations[flow.to].label} : ${formatEth(flow.amount)}`)
    .join(", ")
}

export function Settlement() {
  return (
    <div className="flex flex-col gap-10">
      {/* Ce que détient le contrat */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
          <span className="text-muted-foreground">
            Ce que détient le contrat
          </span>
          <span className="font-mono font-medium tabular-nums">
            {formatEth(total - funds[3].amount)}
            <span className="text-muted-foreground">
              {" "}
              (+ {formatEth(funds[3].amount)} si litige)
            </span>
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
              {fund.key !== "dispute" && (
                <>
                  <span className="hidden truncate text-xs text-muted-foreground sm:block">
                    {fund.label}
                  </span>
                  <span className="hidden truncate font-mono text-sm tabular-nums sm:block">
                    {formatEth(fund.amount)}
                  </span>
                </>
              )}
            </div>
          ))}
        </div>
        <ul className="flex flex-col gap-1.5 text-xs sm:hidden">
          {funds.map((fund) => (
            <li key={fund.key} className="flex items-center gap-2">
              <span
                aria-hidden
                className={cn("size-2.5 shrink-0 rounded-[3px]", fund.tone)}
              />
              <span className="text-muted-foreground">{fund.label}</span>
              <span className="ml-auto font-mono tabular-nums">
                {formatEth(fund.amount)}
              </span>
            </li>
          ))}
        </ul>
        <p className="hidden text-xs text-muted-foreground sm:block">
          Hachuré : la caution de contestation ({formatEth(funds[3].amount)}),
          déposée seulement si un joueur ouvre un litige. La caution de
          l&apos;organisateur couvre au moins le cash prize plus tous les
          tickets possibles.
        </p>
      </div>

      {/* Les quatre issues, alignées sur la même échelle */}
      <div className="flex flex-col gap-3">
        <span className="text-sm text-muted-foreground">
          Où il part à la clôture
        </span>
        <ol className="flex flex-col gap-7 border-t pt-6">
          {outcomes.map((outcome) => (
            <li key={outcome.label} className="flex flex-col gap-2.5">
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <span className="font-medium">{outcome.label}</span>
                <span className="text-xs text-muted-foreground">
                  {outcome.when}
                </span>
              </div>
              <div
                role="img"
                aria-label={describe(outcome.flows)}
                className="flex h-9 gap-1 overflow-hidden rounded-lg"
              >
                {outcome.flows.map((flow) => (
                  <div
                    key={flow.to}
                    style={{ width: share(flow.amount) }}
                    className={destinations[flow.to].tone}
                  />
                ))}
              </div>
              <div
                aria-hidden
                className="flex flex-wrap items-baseline gap-x-4 gap-y-1 font-mono text-xs tabular-nums"
              >
                {outcome.flows.map((flow) => (
                  <span
                    key={flow.to}
                    className={cn(
                      "inline-flex items-center gap-1.5",
                      flow.to === "burn"
                        ? "text-destructive line-through"
                        : "text-muted-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "size-2 shrink-0 rounded-[2px]",
                        destinations[flow.to].tone
                      )}
                    />
                    {formatEth(flow.amount)}
                  </span>
                ))}
              </div>
              {outcome.note && (
                <p className="text-xs text-pretty text-muted-foreground">
                  {outcome.note}
                </p>
              )}
            </li>
          ))}
        </ol>
        <ul
          aria-label="Légende"
          className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t pt-5 text-xs"
        >
          {Object.entries(destinations).map(([key, destination]) => (
            <li key={key} className="flex items-center gap-2">
              <span
                aria-hidden
                className={cn("size-2.5 rounded-[3px]", destination.tone)}
              />
              <span className="text-secondary-foreground">
                {destination.label}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-pretty text-muted-foreground">
          En cas de triche, la caution est brûlée plutôt que partagée : si les
          votants la touchaient, voter « triche » deviendrait rentable pour tous
          les perdants.
        </p>
      </div>
    </div>
  )
}

import { parseEther } from "viem"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DEMO_ARBITRATION_FEE } from "@/lib/ctf/dispute"
import { formatEth } from "@/lib/format"
import { cn } from "@/lib/utils"

// Exemple de docs/DESIGN.md : cash prize 0,4 ETH, ticket 0,05 ETH, 20 places
// dont 16 vendues, caution 1,4 ETH (= cash prize + 20 × ticket), caution de
// contestation 0,15 ETH (= 3 × ticket). Frais d'arbitrage : ceux de
// MockArbitrator. Les règles sont celles de CTFPlatform (litiges simplifiés).
const TICKET = parseEther("0.05")
const SOLD = BigInt(16)
const FEE = DEMO_ARBITRATION_FEE

type PotKey = "prize" | "tickets" | "bond" | "contest"

const pots: { key: PotKey; label: string; detail: string; amount: bigint }[] = [
  {
    key: "prize",
    label: "Cash prize",
    detail: "déposé par l'organisateur",
    amount: parseEther("0.4"),
  },
  {
    key: "tickets",
    label: "Tickets",
    detail: `${SOLD} joueurs × ${formatEth(TICKET)}`,
    amount: SOLD * TICKET,
  },
  {
    key: "bond",
    label: "Caution de l'organisateur",
    detail: "cash prize + 20 places × ticket",
    amount: parseEther("1.4"),
  },
  {
    key: "contest",
    label: "Caution de contestation",
    detail: "déposée seulement si un joueur conteste",
    amount: parseEther("0.15"),
  },
]

const amountOf = (key: PotKey) => pots.find((pot) => pot.key === key)!.amount

type Who = "podium" | "players" | "organizer" | "contester" | "burn"

const who: Record<Who, { label: string; tone: string }> = {
  podium: { label: "Podium", tone: "bg-primary" },
  players: { label: "Joueurs", tone: "bg-info" },
  organizer: { label: "Organisateur", tone: "bg-success" },
  contester: { label: "Contestataire", tone: "bg-warning" },
  burn: {
    label: "Brûlé",
    tone: "bg-[repeating-linear-gradient(135deg,var(--destructive)_0_4px,transparent_4px_8px)] ring-1 ring-destructive/60 ring-inset",
  },
}

/** Une part d'un pot : qui la reçoit, combien, et pourquoi (en clair). */
type Route = { to: Who; amount: bigint; why: string }

type Outcome = {
  key: string
  label: string
  when: string
  /** Routes de chaque pot ; un pot absent n'a pas été déposé. */
  routes: Partial<Record<PotKey, Route[]>>
  note?: string
}

const all = (key: PotKey, to: Who, why: string): Route[] => [
  { to, amount: amountOf(key), why },
]

const outcomes: Outcome[] = [
  {
    key: "winners",
    label: "Des gagnants",
    when: "Au moins une épreuve validée avant la fin, et pas de litige.",
    routes: {
      prize: all("prize", "podium", "partagé par le podium"),
      tickets: all("tickets", "podium", "partagés par le podium"),
      bond: all("bond", "organizer", "rendue"),
    },
  },
  {
    key: "none",
    label: "Aucun gagnant",
    when: "Personne n'a validé d'épreuve.",
    routes: {
      prize: all("prize", "organizer", "rendu"),
      tickets: all("tickets", "players", "chacun reprend son ticket"),
      bond: all("bond", "organizer", "rendue"),
    },
    note: "L'organisateur récupère sa mise, sans rien gagner : publier une épreuve impossible ne rapporte rien.",
  },
  {
    key: "rejected",
    label: "Litige rejeté",
    when: "L'arbitre ne retient pas la triche, ou ne répond pas à temps.",
    routes: {
      prize: all("prize", "podium", "partagé par le podium"),
      tickets: all("tickets", "podium", "partagés par le podium"),
      bond: all("bond", "organizer", "rendue"),
      contest: all("contest", "organizer", "perdue par le contestataire"),
    },
    note: `Le contestataire perd aussi les frais d'arbitrage (${formatEth(FEE)}), versés à l'arbitre en ouvrant le litige.`,
  },
  {
    key: "cheated",
    label: "Triche confirmée",
    when: "L'arbitre retient la triche de l'organisateur.",
    routes: {
      prize: all("prize", "organizer", "rendu"),
      tickets: all("tickets", "players", "chacun reprend son ticket"),
      bond: [
        {
          to: "contester",
          amount: FEE,
          why: "lui rembourse les frais d'arbitrage",
        },
        {
          to: "burn",
          amount: amountOf("bond") - FEE,
          why: "bloqué à vie dans le contrat",
        },
      ],
      contest: all("contest", "contester", "rendue"),
    },
    note: "La caution est brûlée plutôt que donnée : si quelqu'un la touchait, il aurait intérêt à crier à la triche. Le cash prize est rendu, la caution suffit comme punition.",
  },
]

/** Parts du podium, calculées comme CTFPlatform : 2e et 3e d'abord, le reste au 1er. */
function podiumShares(pot: bigint) {
  const second = (pot * BigInt(30)) / BigInt(100)
  const third = (pot * BigInt(10)) / BigInt(100)
  return [pot - second - third, second, third]
}

// Échelle commune à toutes les lignes : le plus gros pot remplit la largeur.
const scale = pots.reduce(
  (max, pot) => (pot.amount > max ? pot.amount : max),
  BigInt(0)
)
const width = (amount: bigint) =>
  `${Number((amount * BigInt(10_000)) / scale) / 100}%`

function totals(outcome: Outcome) {
  const byWho = new Map<Who, bigint>()
  let deposited = BigInt(0)
  for (const pot of pots) {
    const routes = outcome.routes[pot.key]
    if (!routes) continue
    deposited += pot.amount
    for (const route of routes)
      byWho.set(route.to, (byWho.get(route.to) ?? BigInt(0)) + route.amount)
  }
  const paid = [...byWho.values()].reduce((sum, v) => sum + v, BigInt(0))
  return { byWho, deposited, paid }
}

function Dot({ to }: { to: Who }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-2.5 shrink-0 rounded-[3px]",
        who[to].tone
      )}
    />
  )
}

function PotRow({
  pot,
  routes,
}: {
  pot: (typeof pots)[number]
  routes?: Route[]
}) {
  return (
    <li className="grid gap-x-6 gap-y-2 py-4 sm:grid-cols-[13rem_minmax(0,1fr)]">
      <div className={cn("flex flex-col", !routes && "opacity-50")}>
        <span className="flex items-baseline justify-between gap-3 sm:justify-start">
          <span className="font-medium">{pot.label}</span>
          <span className="font-mono text-sm whitespace-nowrap tabular-nums">
            {formatEth(pot.amount)}
          </span>
        </span>
        <span className="text-xs text-muted-foreground">{pot.detail}</span>
      </div>
      {routes ? (
        <div className="flex min-w-0 flex-col gap-2">
          <div
            aria-hidden
            className="flex h-3 gap-0.5"
            style={{ width: width(pot.amount) }}
          >
            {routes.map((route) => (
              <span
                key={route.to}
                className={cn(
                  "h-full min-w-[3px] rounded-[3px]",
                  who[route.to].tone
                )}
                style={{ flexGrow: Number(route.amount / BigInt(1e12)) }}
              />
            ))}
          </div>
          <ul className="flex flex-col gap-1 text-sm">
            {routes.map((route) => (
              <li key={route.to} className="flex items-baseline gap-2">
                <Dot to={route.to} />
                <span>
                  <span className="sr-only">Va à : </span>
                  <span
                    className={cn(
                      "font-medium",
                      route.to === "burn" && "text-destructive"
                    )}
                  >
                    {who[route.to].label}
                  </span>
                  {routes.length > 1 && (
                    <span className="font-mono tabular-nums">
                      {" "}
                      {formatEth(route.amount)}
                    </span>
                  )}
                  <span className="text-muted-foreground">, {route.why}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="self-center text-sm text-muted-foreground">
          Pas de litige : rien n&apos;est déposé.
        </p>
      )}
    </li>
  )
}

function OutcomePanel({ outcome }: { outcome: Outcome }) {
  const { byWho, deposited, paid } = totals(outcome)
  const podium = byWho.get("podium")

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-pretty text-muted-foreground">
        {outcome.when}
      </p>

      <ul className="flex flex-col divide-y border-y">
        {pots.map((pot) => (
          <PotRow key={pot.key} pot={pot} routes={outcome.routes[pot.key]} />
        ))}
      </ul>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm text-muted-foreground">
          Ce que chacun récupère
        </h3>
        <ul className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
          {[...byWho.entries()].map(([to, amount]) => (
            <li key={to} className="flex flex-col gap-0.5">
              <span className="flex items-baseline gap-2">
                <Dot to={to} />
                <span className={cn(to === "burn" && "text-destructive")}>
                  {who[to].label}
                </span>
                <span className="ml-auto font-mono tabular-nums">
                  {formatEth(amount)}
                </span>
              </span>
              {to === "podium" && podium !== undefined && (
                <span className="pl-[1.125rem] text-xs text-muted-foreground">
                  1er {formatEth(podiumShares(podium)[0])}, 2e{" "}
                  {formatEth(podiumShares(podium)[1])}, 3e{" "}
                  {formatEth(podiumShares(podium)[2])}{" "}
                  <span className="whitespace-nowrap">(60 / 30 / 10 %)</span>
                </span>
              )}
              {to === "burn" && (
                <span className="pl-[1.125rem] text-xs text-muted-foreground">
                  Personne ne peut le retirer, pas même l&apos;équipe
                </span>
              )}
              {to === "players" && (
                <span className="pl-[1.125rem] text-xs text-muted-foreground">
                  {formatEth(TICKET)} chacun, avec « Récupérer mon ticket »
                </span>
              )}
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          {formatEth(deposited)} déposés, {formatEth(paid)} répartis
          {deposited === paid && " : il ne reste rien de bloqué par erreur"}.
        </p>
        {outcome.note && (
          <p className="text-xs text-pretty text-muted-foreground">
            {outcome.note}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * « Où va l'argent » : les mêmes pots, dans le même ordre, pour chacune des
 * quatre issues. Seule leur destination change d'un onglet à l'autre.
 */
export function Settlement() {
  return (
    <Tabs defaultValue="winners" className="w-full min-w-0 gap-6">
      <TabsList
        variant="line"
        aria-label="Issue du CTF"
        className="w-full justify-start overflow-x-auto"
      >
        {outcomes.map((outcome) => (
          <TabsTrigger
            key={outcome.key}
            value={outcome.key}
            className="flex-none px-2"
          >
            {outcome.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {outcomes.map((outcome) => (
        <TabsContent key={outcome.key} value={outcome.key}>
          <OutcomePanel outcome={outcome} />
        </TabsContent>
      ))}
    </Tabs>
  )
}

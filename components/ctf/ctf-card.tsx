import { StatusPill } from "@/components/ctf/status-pill"
import { VulnTag } from "@/components/ctf/vuln-tag"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { truncateAddress } from "@/lib/onchain/format"
import { formatEth, formatInt, formatRemaining } from "@/lib/format"
import {
  inDispute,
  isClosed,
  type Ctf,
  type CtfStatus,
} from "@/lib/mock/explore"
import { cn } from "@/lib/utils"

const phasePrefix: Record<CtfStatus, string> = {
  open: "début dans",
  running: "fin dans",
  contestation: "contestation :",
  voting: "vote :",
  appeal: "appel :",
  finalized: "",
  cheated: "",
}

export function remainingLabel(ctf: Ctf) {
  if (isClosed(ctf.status)) return "clôturé"
  return `${phasePrefix[ctf.status]} ${formatRemaining(ctf.remaining)}`
}

function progressTone(status: CtfStatus) {
  if (inDispute(status) || status === "contestation")
    return "[&_[data-slot=progress-indicator]]:bg-warning"
  if (isClosed(status))
    return "[&_[data-slot=progress-indicator]]:bg-muted-foreground/40"
  if (status === "open") return "[&_[data-slot=progress-indicator]]:bg-info"
  return "[&_[data-slot=progress-indicator]]:bg-linear-to-r [&_[data-slot=progress-indicator]]:from-chart-1 [&_[data-slot=progress-indicator]]:to-chart-2"
}

export function CtfCard({ ctf }: { ctf: Ctf }) {
  const pct = Math.round(ctf.elapsed * 100)

  return (
    <Card className="gap-5 rounded-2xl py-6 [--card-spacing:--spacing(6)]">
      <CardHeader className="gap-4">
        <div className="flex items-center justify-between gap-3">
          <StatusPill status={ctf.status} />
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {remainingLabel(ctf)}
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <CardTitle className="text-lg font-semibold">{ctf.title}</CardTitle>
          <CardDescription>
            {ctf.challenges} épreuve{ctf.challenges > 1 ? "s" : ""}, par{" "}
            <span className="font-mono">
              {truncateAddress(ctf.organizer, 3)}
            </span>
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        <dl className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <dt className="text-xs text-muted-foreground">Cagnotte</dt>
            <dd className="text-2xl font-semibold tabular-nums">
              {formatEth(ctf.prizePool)}
            </dd>
          </div>
          <div className="flex flex-col items-end gap-1">
            <dt className="text-xs text-muted-foreground">Ticket</dt>
            <dd className="text-base font-semibold tabular-nums">
              {formatEth(ctf.ticketPrice)}
            </dd>
          </div>
        </dl>

        <div className="flex flex-col gap-2">
          <Progress
            value={pct}
            aria-label="Temps écoulé dans la phase"
            className={cn(
              "[&_[data-slot=progress-indicator]]:rounded-full [&_[data-slot=progress-track]]:h-2 [&_[data-slot=progress-track]]:bg-accent",
              progressTone(ctf.status)
            )}
          />
          <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
            <span>
              {formatInt(ctf.players)} / {formatInt(ctf.maxPlayers)} joueurs
            </span>
            <span>Caution {formatEth(ctf.bond)}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex-wrap gap-2 border-t-0 bg-transparent pt-0">
        {ctf.vulns.map((vuln) => (
          <VulnTag key={vuln} vuln={vuln} />
        ))}
      </CardFooter>
    </Card>
  )
}

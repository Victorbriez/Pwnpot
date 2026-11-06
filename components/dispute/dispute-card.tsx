"use client"

import { useState } from "react"
import Link from "next/link"
import {
  CircleCheckIcon,
  CircleDashedIcon,
  CircleDotIcon,
  CircleMinusIcon,
  FlaskConicalIcon,
  GavelIcon,
  ScaleIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { DataList, DataRow } from "@/components/site/data-list"
import type { Dispute } from "@/hooks/use-dispute"
import { settlement, type DisputeState } from "@/lib/ctf/dispute"
import { formatEth, formatInt, formatRemaining } from "@/lib/format"

export type Role = "player" | "organizer"

type Step = {
  key: "contestation" | "voting" | "appealWindow" | "appealed" | "result"
  label: string
  duration?: string
}

const steps: Step[] = [
  { key: "contestation", label: "Contestation", duration: "48 h" },
  { key: "voting", label: "Vote des joueurs", duration: "48 h" },
  { key: "appealWindow", label: "Appel", duration: "24 h" },
  { key: "appealed", label: "Arbitre", duration: "7 j max" },
  { key: "result", label: "Résultat" },
]

type StepState = "done" | "current" | "upcoming" | "skipped"

function stepStates(state: DisputeState): StepState[] {
  const final = state.phase === "finalized" || state.phase === "cheated"
  const current = final
    ? steps.length - 1
    : steps.findIndex((step) => step.key === state.phase)
  return steps.map((step, index) => {
    if (index === current) return final ? "done" : "current"
    if (index > current) return "upcoming"
    const skipped =
      ((step.key === "voting" || step.key === "appealWindow") &&
        !state.opened) ||
      (step.key === "appealed" && !state.appellant)
    return skipped ? "skipped" : "done"
  })
}

const advanceLabel: Partial<Record<DisputeState["phase"], string>> = {
  contestation: "Terminer la contestation",
  voting: "Terminer le vote",
  appealWindow: "Terminer la fenêtre d'appel",
}

const stepIcon = {
  done: CircleCheckIcon,
  current: CircleDotIcon,
  upcoming: CircleDashedIcon,
  skipped: CircleMinusIcon,
} as const

function percent(part: number, total: number) {
  return total === 0 ? 0 : Math.round((part / total) * 100)
}

export function DisputeCard({
  dispute,
  tickets,
  busy,
  isDemo,
  role,
  onRoleChange,
}: {
  dispute: NonNullable<Dispute>
  tickets: number
  busy: boolean
  isDemo: boolean
  role: Role
  onRoleChange: (role: Role) => void
}) {
  const { state, outcome } = dispute
  const [pending, setPending] = useState<string>()
  const final = state.phase === "finalized" || state.phase === "cheated"
  const states = stepStates(state)
  const run = (key: string, action: () => void) => {
    setPending(key)
    action()
  }
  const spin = (key: string) =>
    busy && pending === key ? <Spinner data-icon="inline-start" /> : null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScaleIcon className="size-4" />
          Litige
        </CardTitle>
        <CardDescription>
          Un détenteur de ticket peut contester le résultat. Les joueurs votent,
          puis le camp perdant peut faire appel à un arbitre.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <ItemGroup className="gap-1">
          {steps.map((step, index) => {
            const s = states[index]
            const Icon = stepIcon[s]
            return (
              <Item
                key={step.key}
                size="xs"
                variant={s === "current" ? "muted" : "default"}
                data-state={s}
                className="data-[state=skipped]:opacity-50 data-[state=upcoming]:opacity-60"
              >
                <ItemMedia>
                  <Icon
                    className={
                      s === "current"
                        ? "text-primary"
                        : s === "done"
                          ? "text-success-text"
                          : "text-muted-foreground"
                    }
                  />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle
                    className={s === "skipped" ? "line-through" : undefined}
                  >
                    {step.label}
                  </ItemTitle>
                </ItemContent>
                <ItemActions className="text-xs text-muted-foreground tabular-nums">
                  {s === "current" ? (
                    <Badge variant="brand">
                      reste {formatRemaining(state.remaining)}
                    </Badge>
                  ) : s === "skipped" ? (
                    "sautée"
                  ) : (
                    step.duration
                  )}
                </ItemActions>
              </Item>
            )
          })}
        </ItemGroup>

        {state.opened && (
          <>
            <Separator />
            <section
              aria-label="Décompte des voix"
              className="flex flex-col gap-3"
            >
              <VoteBar
                label="Triche"
                count={state.cheatVotes}
                total={outcome.voters}
                tone="destructive"
              />
              <VoteBar
                label="Pas de triche"
                count={state.fairVotes}
                total={outcome.voters}
                tone="success"
              />
              <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {formatInt(outcome.voters)} votant
                {outcome.voters > 1 ? "s" : ""} · quorum{" "}
                {formatInt(outcome.quorum)} (max(3, 20 % de {formatInt(tickets)}{" "}
                tickets))
                <Badge variant={outcome.quorumReached ? "success" : "warning"}>
                  {outcome.quorumReached ? "atteint" : "pas atteint"}
                </Badge>
              </p>
            </section>
          </>
        )}

        <Separator />

        {state.phase === "contestation" && (
          <PhaseAction
            text={`Une triche à signaler (solution fuitée, factory truquée) ? Ouvre un litige : ta caution de ${formatEth(dispute.bond)} t'est rendue si la triche est confirmée, et versée à l'organisateur sinon.`}
            reason={
              dispute.canOpen
                ? undefined
                : role === "organizer"
                  ? "L'organisateur ne peut pas contester son propre CTF."
                  : "Réservé aux détenteurs de ticket."
            }
          >
            <Button
              variant="destructive"
              disabled={!dispute.canOpen || busy}
              onClick={() => run("open", dispute.openDispute)}
            >
              {spin("open") ?? <ShieldAlertIcon data-icon="inline-start" />}
              Ouvrir un litige · {formatEth(dispute.bond)}
            </Button>
          </PhaseAction>
        )}

        {state.phase === "voting" && (
          <PhaseAction
            text={
              state.myVote !== undefined
                ? `Tu as voté « ${state.myVote ? "triche" : "pas de triche"} ». 1 adresse = 1 voix.`
                : "L'organisateur a-t-il triché ? 1 adresse = 1 voix. La triche est retenue avec plus de 50 % des voix, si le quorum est atteint."
            }
            reason={
              dispute.canVote || state.myVote !== undefined
                ? undefined
                : "Réservé aux détenteurs de ticket."
            }
          >
            {state.myVote === undefined && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="destructive"
                  disabled={!dispute.canVote || busy}
                  onClick={() => run("cheat", () => dispute.vote(true))}
                >
                  {spin("cheat") ?? (
                    <ShieldAlertIcon data-icon="inline-start" />
                  )}
                  Triche
                </Button>
                <Button
                  variant="outline"
                  disabled={!dispute.canVote || busy}
                  onClick={() => run("fair", () => dispute.vote(false))}
                >
                  {spin("fair") ?? <ShieldCheckIcon data-icon="inline-start" />}
                  Pas de triche
                </Button>
              </div>
            )}
          </PhaseAction>
        )}

        {state.phase === "appealWindow" && (
          <PhaseAction
            text={`Le vote donne « ${outcome.cheated ? "triche" : "pas de triche"} »${outcome.quorumReached ? "" : " (quorum raté)"}. ${
              dispute.loser === "organizer"
                ? "L'organisateur"
                : "Un détenteur de ticket"
            } peut faire appel à l'arbitre : les frais (${formatEth(dispute.fee)}) lui sont remboursés s'il gagne.`}
            reason={
              dispute.canAppeal
                ? undefined
                : dispute.loser === "organizer"
                  ? "Seul l'organisateur peut faire appel de ce vote."
                  : "Réservé aux détenteurs de ticket."
            }
          >
            <Button
              disabled={!dispute.canAppeal || busy}
              onClick={() => run("appeal", dispute.appeal)}
            >
              {spin("appeal") ?? <GavelIcon data-icon="inline-start" />}
              Faire appel · {formatEth(dispute.fee)}
            </Button>
          </PhaseAction>
        )}

        {state.phase === "appealed" && (
          <p className="text-sm text-muted-foreground">
            {state.appellant === "organizer" ? "L'organisateur" : "Un joueur"} a
            fait appel. L&apos;arbitre (ERC-792) tranche ; sa décision est
            définitive. Sans réponse sous 7 jours, le résultat du vote
            s&apos;applique.
          </p>
        )}

        {final && <Result state={state} />}

        {isDemo && !final && (
          <Alert>
            <FlaskConicalIcon />
            <AlertTitle>Commandes de démo</AlertTitle>
            <AlertDescription className="flex flex-col gap-3">
              <span>
                Sur la chaîne, le temps et l&apos;arbitre avancent seuls. Ici,
                tu les fais avancer pour jouer le scénario.
              </span>
              <ToggleGroup
                aria-label="Voir en tant que"
                variant="outline"
                size="sm"
                spacing={0}
                value={[role]}
                onValueChange={(value) => {
                  const next = value[0] as Role | undefined
                  if (next) onRoleChange(next)
                }}
              >
                <ToggleGroupItem value="player">Joueur</ToggleGroupItem>
                <ToggleGroupItem value="organizer">
                  Organisateur
                </ToggleGroupItem>
              </ToggleGroup>
              <div className="flex flex-wrap gap-2">
                {state.phase === "appealed" ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => dispute.demo.rule(true)}
                    >
                      Arbitre : triche
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => dispute.demo.rule(false)}
                    >
                      Arbitre : pas de triche
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={dispute.demo.advance}
                    >
                      Timeout de l&apos;arbitre
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={dispute.demo.advance}
                  >
                    {advanceLabel[state.phase]}
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

function VoteBar({
  label,
  count,
  total,
  tone,
}: {
  label: string
  count: number
  total: number
  tone: "destructive" | "success"
}) {
  const pct = percent(count, total)
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-sm tabular-nums">
        <span>{label}</span>
        <span className="text-muted-foreground">
          {formatInt(count)} · {pct} %
        </span>
      </div>
      <Progress
        value={pct}
        aria-label={`Voix « ${label} »`}
        className={
          tone === "destructive"
            ? "[&_[data-slot=progress-indicator]]:bg-destructive"
            : "[&_[data-slot=progress-indicator]]:bg-success"
        }
      />
    </div>
  )
}

function PhaseAction({
  text,
  reason,
  children,
}: {
  text: string
  reason?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">{text}</p>
      {children}
      {reason && <p className="text-xs text-muted-foreground">{reason}</p>}
    </div>
  )
}

function Result({ state }: { state: DisputeState }) {
  const cheated = state.phase === "cheated"
  const decidedBy = !state.opened
    ? "Aucun litige pendant la contestation."
    : state.ruling !== undefined
      ? "Décision de l'arbitre, définitive."
      : state.appellant
        ? "L'arbitre n'a pas répondu : le vote s'applique."
        : "Résultat du vote, sans appel."
  return (
    <div className="flex flex-col gap-4">
      <Alert variant={cheated ? "destructive" : "default"}>
        {cheated ? (
          <ShieldAlertIcon />
        ) : (
          <ShieldCheckIcon className="text-success-text" />
        )}
        <AlertTitle>
          {cheated
            ? "Triche confirmée"
            : state.opened
              ? "Pas de triche"
              : "CTF finalisé"}
        </AlertTitle>
        <AlertDescription>{decidedBy}</AlertDescription>
      </Alert>
      <DataList>
        {settlement(state).map((line) => (
          <DataRow key={line.who} label={line.who}>
            {line.what}
          </DataRow>
        ))}
      </DataList>
      <Link href="/gains" className={buttonVariants({ variant: "outline" })}>
        Voir ce que je peux retirer
      </Link>
    </div>
  )
}

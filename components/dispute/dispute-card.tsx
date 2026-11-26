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
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { DataList, DataRow } from "@/components/site/data-list"
import type { DisputeModel } from "@/hooks/use-dispute"
import { settlement, type DisputeState } from "@/lib/ctf/dispute"
import { formatEth, formatRemaining, formatTimeLeft } from "@/lib/format"

export type Role = "player" | "organizer"

type Step = {
  key: "contestation" | "appealed" | "result"
  label: string
  duration?: string
}

const steps: Step[] = [
  { key: "contestation", label: "Contestation", duration: "48 h" },
  { key: "appealed", label: "Arbitre (ERC-792)", duration: "7 j max" },
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
    return step.key === "appealed" && !state.opened ? "skipped" : "done"
  })
}

const stepIcon = {
  done: CircleCheckIcon,
  current: CircleDotIcon,
  upcoming: CircleDashedIcon,
  skipped: CircleMinusIcon,
} as const

export function DisputeCard({
  dispute,
  busy,
  role,
  onRoleChange,
}: {
  dispute: DisputeModel
  busy: boolean
  /** Sélecteur joueur / organisateur : démo seulement. */
  role?: Role
  onRoleChange?: (role: Role) => void
}) {
  const { state, bond, fee } = dispute
  const [pending, setPending] = useState<string>()
  const final = state.phase === "finalized" || state.phase === "cheated"
  const states = stepStates(state)
  const run = (key: string, action: () => void) => {
    setPending(key)
    action()
  }
  const spin = (key: string) =>
    busy && pending === key ? <Spinner data-icon="inline-start" /> : null
  const total = fee === undefined ? undefined : bond + fee

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScaleIcon className="size-4" />
          Litige
        </CardTitle>
        <CardDescription>
          Un détenteur de ticket peut contester le résultat pendant 48 h. Le
          litige part directement à l&apos;arbitre, dont la décision est
          définitive.
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
                      {formatTimeLeft(state.remaining)}
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

        <Separator />

        {state.phase === "contestation" && (
          <PhaseAction
            text={`Une triche à signaler (solution fuitée, factory truquée) ? Ouvre un litige : tu déposes une caution de ${formatEth(bond)} et tu avances les frais de l'arbitre${fee === undefined ? "" : ` (${formatEth(fee)})`}. Les deux te sont rendus si la triche est confirmée ; sinon la caution va à l'organisateur et les frais sont perdus.`}
            reason={dispute.canOpen ? undefined : dispute.openBlocked}
          >
            <Button
              variant="destructive"
              disabled={!dispute.canOpen || busy}
              onClick={() => run("open", dispute.openDispute)}
            >
              {spin("open") ?? <ShieldAlertIcon data-icon="inline-start" />}
              Ouvrir un litige
              {total !== undefined && ` · ${formatEth(total)}`}
            </Button>
          </PhaseAction>
        )}

        {state.phase === "appealed" && (
          <PhaseAction
            text={`${state.mine ? "Tu as ouvert ce litige." : "Un joueur a ouvert un litige."} L'arbitre (ERC-792) tranche : « triche » ou « pas de triche ». Sans réponse sous 7 jours, n'importe qui peut clore le litige, qui est alors rejeté.`}
          >
            {!dispute.demo && (
              <Button
                variant="outline"
                disabled={!dispute.canClose || busy}
                onClick={() => run("close", dispute.closeAfterTimeout)}
              >
                {spin("close") ?? <GavelIcon data-icon="inline-start" />}
                {dispute.canClose
                  ? "Clore le litige (l'arbitre n'a pas répondu)"
                  : `Clôture possible dans ${formatRemaining(state.remaining)}`}
              </Button>
            )}
          </PhaseAction>
        )}

        {final && <Result state={state} />}

        {dispute.demo && !final && (
          <Alert>
            <FlaskConicalIcon />
            <AlertTitle>Commandes de démo</AlertTitle>
            <AlertDescription className="flex flex-col gap-3">
              <span>
                Sur la chaîne, le temps et l&apos;arbitre avancent seuls. Ici,
                tu les fais avancer pour jouer le scénario.
              </span>
              {role && onRoleChange && (
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
              )}
              <div className="flex flex-wrap gap-2">
                {state.phase === "appealed" ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => dispute.demo?.rule(true)}
                    >
                      Arbitre : triche
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => dispute.demo?.rule(false)}
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
                    Terminer la contestation
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

function PhaseAction({
  text,
  reason,
  children,
}: {
  text: string
  reason?: string
  children?: React.ReactNode
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
    : state.decision === "timeout"
      ? "L'arbitre n'a pas répondu dans les 7 jours : le litige est rejeté."
      : "Décision de l'arbitre, définitive."
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
              ? "Litige rejeté"
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

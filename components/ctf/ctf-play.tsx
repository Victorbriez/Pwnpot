"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowDownToLineIcon,
  BoxIcon,
  CircleCheckIcon,
  FlaskConicalIcon,
  ShieldCheckIcon,
  TicketIcon,
  TrophyIcon,
} from "lucide-react"
import { parseEventLogs, type Address, type TransactionReceipt } from "viem"
import { baseSepolia } from "viem/chains"

import { VulnTag } from "@/components/ctf/vuln-tag"
import { TxStatusAlert } from "@/components/onchain/tx-status"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AddressDisplay } from "@/components/ui/address-display"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { usePlatformTx } from "@/hooks/use-platform-tx"
import { playerNextStep, organizerNextStep } from "@/lib/ctf/next-step"
import { formatEth, formatInt, formatRemaining } from "@/lib/format"
import { ctfChallenges, leaderboard, withMyScore } from "@/lib/mock/ctf-detail"
import { ctfs, type Ctf } from "@/lib/mock/explore"
import { myOrganized, myParticipations } from "@/lib/mock/my-ctfs"
import { ctfPlatformAbi } from "@/lib/onchain/ctf-platform"
import { truncateAddress } from "@/lib/onchain/format"
import { cn } from "@/lib/utils"

type Action =
  { kind: "ticket" } | { kind: "instance" | "submit"; level: number }

const toneVariant = {
  neutral: "muted",
  action: "brand",
  warning: "warning",
  money: "success",
} as const

/** Podium 60 / 30 / 10 % ; les arrondis vont au 1er (docs/DESIGN.md). */
function podiumShares(pool: bigint) {
  const second = (pool * BigInt(30)) / BigInt(100)
  const third = (pool * BigInt(10)) / BigInt(100)
  return [pool - second - third, second, third]
}

function demoInstance(ctfId: number, level: number): Address {
  return `0x${`${ctfId}${level}`.padStart(4, "0").repeat(10)}`
}

export function CtfPlay({ ctfId }: { ctfId: number }) {
  const ctf = ctfs.find((item) => item.id === ctfId) as Ctf
  const participation = myParticipations.find((p) => p.ctf.id === ctfId)
  const organized = myOrganized.find((o) => o.ctf.id === ctfId)
  const challenges = ctfChallenges(ctf)
  const tx = usePlatformTx()

  const [hasTicket, setHasTicket] = useState(participation !== undefined)
  const [solved, setSolved] = useState<number[]>(
    Array.from({ length: participation?.solved ?? 0 }, (_, i) => i)
  )
  const [instances, setInstances] = useState<Record<number, Address>>({})
  const [players, setPlayers] = useState(ctf.players)
  const [action, setAction] = useState<Action>()

  const board = withMyScore(leaderboard(ctf), {
    score: solved.length,
    rank: participation?.rank ?? null,
  })
  const myRank = board.find((entry) => entry.isMe)?.rank ?? null
  const busy = tx.status === "signing" || tx.status === "confirming"
  const playing = ctf.status === "running"
  const canBuy =
    (ctf.status === "open" || ctf.status === "running") &&
    players < ctf.maxPlayers
  const pool = ctf.cashPrize + ctf.ticketPrice * BigInt(players)
  const shares = podiumShares(pool)

  const step = organized
    ? organizerNextStep(organized)
    : playerNextStep({
        ctf,
        solved: solved.length,
        rank: myRank,
        voted: participation?.voted ?? false,
        owed: participation?.owed ?? BigInt(0),
      })

  const buyTicket = () => {
    setAction({ kind: "ticket" })
    tx.send(
      {
        functionName: "buyTicket",
        args: [BigInt(ctf.id)],
        value: ctf.ticketPrice,
      },
      {
        onSuccess: () => {
          setHasTicket(true)
          setPlayers((n) => n + 1)
        },
      }
    )
  }

  const createInstance = (level: number) => {
    setAction({ kind: "instance", level })
    tx.send(
      { functionName: "createInstance", args: [BigInt(ctf.id), BigInt(level)] },
      {
        onSuccess: (receipt?: TransactionReceipt) => {
          const instance = receipt
            ? parseEventLogs({
                abi: ctfPlatformAbi,
                eventName: "InstanceCreated",
                logs: receipt.logs,
              })[0]?.args.instance
            : demoInstance(ctf.id, level)
          if (instance) setInstances((prev) => ({ ...prev, [level]: instance }))
        },
      }
    )
  }

  const submit = (level: number) => {
    setAction({ kind: "submit", level })
    tx.send(
      { functionName: "submit", args: [BigInt(ctf.id), BigInt(level)] },
      { onSuccess: () => setSolved((prev) => [...prev, level]) }
    )
  }

  const pendingOn = (kind: Action["kind"], level?: number) =>
    busy &&
    action?.kind === kind &&
    (level === undefined ||
      (action.kind !== "ticket" && action.level === level))

  const lockedReason = !hasTicket
    ? "Achète un ticket pour jouer."
    : ctf.status === "open"
      ? `Les épreuves ouvrent dans ${formatRemaining(ctf.remaining)}.`
      : !playing
        ? "Le CTF est terminé : plus de soumission possible."
        : undefined

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Épreuves</CardTitle>
            <CardDescription>
              {lockedReason ??
                "Crée ton instance, exploite-la, puis demande la vérification. Le contrat appelle validateInstance : pas de flag à recopier."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ItemGroup className="gap-3">
              {challenges.map((challenge, level) => {
                const done = solved.includes(level)
                const instance = instances[level]
                return (
                  <Item key={challenge.id} variant="outline" className="gap-4">
                    <ItemMedia variant="icon">
                      {done ? (
                        <CircleCheckIcon className="text-success-text" />
                      ) : (
                        <BoxIcon />
                      )}
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>
                        {level + 1}. {challenge.name}
                        <VulnTag vuln={challenge.vuln} />
                      </ItemTitle>
                      <ItemDescription>
                        {done
                          ? "Réussie : 1 point."
                          : instance
                            ? `Ton instance : ${truncateAddress(instance)}`
                            : "Pas encore d'instance."}
                      </ItemDescription>
                    </ItemContent>
                    {!done && !lockedReason && (
                      <ItemActions>
                        {instance ? (
                          <Button
                            size="sm"
                            disabled={busy}
                            onClick={() => submit(level)}
                          >
                            {pendingOn("submit", level) ? (
                              <Spinner data-icon="inline-start" />
                            ) : (
                              <ShieldCheckIcon data-icon="inline-start" />
                            )}
                            Vérifier ma réussite
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => createInstance(level)}
                          >
                            {pendingOn("instance", level) && (
                              <Spinner data-icon="inline-start" />
                            )}
                            Créer mon instance
                          </Button>
                        )}
                      </ItemActions>
                    )}
                    {done && (
                      <ItemActions>
                        <Badge variant="success">Réussie</Badge>
                      </ItemActions>
                    )}
                  </Item>
                )
              })}
            </ItemGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Classement</CardTitle>
            <CardDescription>
              1 point par épreuve. À égalité, la dernière réussite la plus tôt
              passe devant.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {board.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rang</TableHead>
                    <TableHead>Joueur</TableHead>
                    <TableHead className="text-right">Épreuves</TableHead>
                    <TableHead className="text-right">Gain estimé</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {board.map((entry) => (
                    <TableRow
                      key={entry.address}
                      data-state={entry.isMe ? "selected" : undefined}
                    >
                      <TableCell className="font-medium tabular-nums">
                        {entry.rank}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          <span className="font-mono">
                            {truncateAddress(entry.address)}
                          </span>
                          {entry.isMe && <Badge variant="brand">Toi</Badge>}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {entry.score} / {ctf.challenges}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {entry.rank <= 3
                          ? formatEth(shares[entry.rank - 1])
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Empty className="border border-dashed">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <TrophyIcon />
                  </EmptyMedia>
                  <EmptyTitle>Personne n&apos;a encore marqué</EmptyTitle>
                  <EmptyDescription>
                    Le classement se remplit à chaque épreuve réussie.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6 lg:sticky lg:top-20">
        <Card>
          <CardHeader>
            <CardDescription>Cagnotte</CardDescription>
            <CardTitle className="text-3xl font-semibold tabular-nums">
              {formatEth(pool)}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            <div className="flex flex-col gap-2">
              <Progress
                value={(players / ctf.maxPlayers) * 100}
                aria-label="Places vendues"
              />
              <p className="text-muted-foreground tabular-nums">
                {formatInt(players)} / {formatInt(ctf.maxPlayers)} joueurs
              </p>
            </div>
            <dl className="flex flex-col gap-2">
              <Row label="Ticket">{formatEth(ctf.ticketPrice)}</Row>
              <Row label="Cash prize">{formatEth(ctf.cashPrize)}</Row>
              <Row label="Caution de l'organisateur">{formatEth(ctf.bond)}</Row>
              <Row label="Podium">
                {shares
                  .map((share) => formatEth(share, { unit: false }))
                  .join(" / ")}{" "}
                ETH
              </Row>
            </dl>
            <Separator />
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground">Organisateur</span>
              <AddressDisplay
                address={ctf.organizer}
                chainId={baseSepolia.id}
                addressClassName="font-mono text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{organized ? "Ton CTF" : "Ta participation"}</CardTitle>
            {(hasTicket || organized) && (
              <CardDescription>
                <Badge
                  variant={toneVariant[step.tone]}
                  className="h-auto py-1 whitespace-normal"
                >
                  {step.label}
                </Badge>
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            {organized ? (
              <p className="text-muted-foreground">
                Tu organises ce CTF. Ta caution reste bloquée jusqu&apos;à la
                fin ; tu la récupères dans « Mes gains » si aucune triche
                n&apos;est confirmée.
              </p>
            ) : hasTicket ? (
              <dl className="flex flex-col gap-2">
                <Row label="Épreuves réussies">
                  {solved.length} / {ctf.challenges}
                </Row>
                <Row label="Rang">
                  {myRank !== null
                    ? `${myRank} sur ${formatInt(players)}`
                    : "non classé"}
                </Row>
              </dl>
            ) : (
              <p className="text-muted-foreground">
                {canBuy
                  ? "Ton ticket entre dans la cagnotte. Il est remboursé si personne ne réussit ou si la triche est confirmée."
                  : "Les inscriptions sont fermées."}
              </p>
            )}
            {tx.isDemo && tx.status === "idle" && !organized && (
              <Alert>
                <FlaskConicalIcon />
                <AlertTitle>Mode démo</AlertTitle>
                <AlertDescription>
                  Les transactions sont simulées et la vérification réussit
                  toujours. Sur la chaîne, validateInstance vérifie ton exploit.
                </AlertDescription>
              </Alert>
            )}
            <TxStatusAlert
              status={tx.status}
              hash={tx.hash}
              error={tx.error}
              isDemo={tx.isDemo}
            />
          </CardContent>
          {!organized && !hasTicket && canBuy && (
            <CardFooter>
              <Button
                size="lg"
                className="w-full"
                disabled={busy}
                onClick={buyTicket}
              >
                {pendingOn("ticket") ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <TicketIcon data-icon="inline-start" />
                )}
                Acheter un ticket · {formatEth(ctf.ticketPrice)}
              </Button>
            </CardFooter>
          )}
          {step.tone === "money" && (
            <CardFooter>
              <Link
                href="/gains"
                className={cn(buttonVariants({ size: "lg" }), "w-full")}
              >
                <ArrowDownToLineIcon data-icon="inline-start" />
                Retirer dans Mes gains
              </Link>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{children}</dd>
    </div>
  )
}

"use client"

import Link from "next/link"
import {
  ArrowDownToLineIcon,
  BoxIcon,
  CircleCheckIcon,
  FlagIcon,
  SearchXIcon,
  ShieldCheckIcon,
  TicketIcon,
  TrophyIcon,
} from "lucide-react"
import { baseSepolia } from "viem/chains"

import { remainingLabel } from "@/components/ctf/ctf-card"
import { FactoryVerificationBadge } from "@/components/ctf/factory-verification-badge"
import { StatusPill } from "@/components/ctf/status-pill"
import { VulnTag } from "@/components/ctf/vuln-tag"
import { DisputeCard } from "@/components/dispute/dispute-card"
import { ChainError, ChainLoading } from "@/components/onchain/chain-state"
import { TxStatusAlert } from "@/components/onchain/tx-status"
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
import { DataList, DataRow } from "@/components/site/data-list"
import {
  useCtfPlay,
  type CtfPlayModel,
  type PlayAction,
} from "@/hooks/use-ctf-play"
import { formatEth, formatInt, formatRemaining } from "@/lib/format"
import { truncateAddress } from "@/lib/onchain/format"
import { cn } from "@/lib/utils"

const toneVariant = {
  neutral: "muted",
  action: "brand",
  warning: "warning",
  money: "success",
} as const

export function CtfPlay({ ctfId }: { ctfId: number }) {
  const state = useCtfPlay(ctfId)
  if (state.status === "loading") return <ChainLoading />
  if (state.status === "error") return <ChainError error={state.error} />
  if (state.status === "missing")
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchXIcon />
          </EmptyMedia>
          <EmptyTitle>Ce CTF n&apos;existe pas</EmptyTitle>
          <EmptyDescription>
            Aucun CTF ne porte ce numéro sur le contrat.{" "}
            <Link href="/explore" className="underline underline-offset-4">
              Voir tous les CTF
            </Link>
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  return <CtfPlayView model={state.model} />
}

function CtfPlayView({ model }: { model: CtfPlayModel }) {
  const {
    ctf: live,
    challenges,
    players,
    pool,
    shares,
    board,
    myRank,
    solvedCount,
    hasTicket: playerHas,
    isOrganizer,
    role,
    dispute,
    step,
    canBuy,
    canFinalize,
    canRefund,
    needsWallet,
    tx,
    action,
  } = model
  const ctf = live
  const busy = tx.status === "signing" || tx.status === "confirming"
  const playing = live.status === "running"

  const pendingOn = (kind: PlayAction["kind"], level?: number) =>
    busy &&
    action?.kind === kind &&
    (level === undefined || ("level" in action && action.level === level))

  const lockedReason = needsWallet
    ? "Connecte ton wallet pour jouer."
    : !playerHas
      ? isOrganizer
        ? "Tu organises ce CTF."
        : "Achète un ticket pour jouer."
      : live.status === "open"
        ? `Les épreuves ouvrent dans ${formatRemaining(live.remaining)}.`
        : !playing
          ? "Le CTF est terminé : plus de soumission possible."
          : undefined

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <StatusPill status={live.status} />
        <span className="font-mono text-sm text-muted-foreground tabular-nums">
          {remainingLabel(live)}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        <div className="flex flex-col gap-6">
          {dispute && role && (
            <DisputeCard
              dispute={dispute}
              tickets={players}
              busy={busy}
              isDemo={tx.isDemo}
              role={role.value}
              onRoleChange={role.set}
            />
          )}
          {!tx.isDemo && live.status === "contestation" && (
            <Card>
              <CardHeader>
                <CardTitle>Contestation</CardTitle>
                <CardDescription>
                  {live.remaining > 0
                    ? `Fenêtre de contestation ouverte encore ${formatRemaining(live.remaining)}. L'ouverture d'un litige arrive avec la prochaine version du contrat.`
                    : "La fenêtre de contestation est passée : n'importe qui peut finaliser le CTF."}
                </CardDescription>
              </CardHeader>
              {canFinalize && (
                <CardFooter>
                  <Button disabled={busy} onClick={model.finalize}>
                    {pendingOn("finalize") ? (
                      <Spinner data-icon="inline-start" />
                    ) : (
                      <FlagIcon data-icon="inline-start" />
                    )}
                    Finaliser et répartir la cagnotte
                  </Button>
                </CardFooter>
              )}
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Épreuves</CardTitle>
              <CardDescription>
                {lockedReason ??
                  `Crée ton instance, exploite-la, puis demande la vérification. Le contrat appelle validateInstance : pas de flag à recopier.${tx.isDemo ? " En démo, la vérification réussit toujours." : ""}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ItemGroup className="gap-3">
                {challenges.map((challenge, level) => {
                  const done = challenge.done
                  const instance = challenge.instance
                  return (
                    <Item
                      key={challenge.key}
                      variant="outline"
                      className="gap-4"
                    >
                      <ItemMedia variant="icon">
                        {done ? (
                          <CircleCheckIcon className="text-success-text" />
                        ) : (
                          <BoxIcon />
                        )}
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle className="line-clamp-none flex-wrap">
                          {level + 1}. {challenge.name}
                          {challenge.vuln && <VulnTag vuln={challenge.vuln} />}
                          {challenge.factory && (
                            <FactoryVerificationBadge
                              factory={challenge.factory}
                            />
                          )}
                        </ItemTitle>
                        <ItemDescription>
                          {done
                            ? "Réussie : 1 point."
                            : instance
                              ? `Ton instance : ${truncateAddress(instance)}`
                              : playing
                                ? "Pas encore d'instance."
                                : "Non résolue."}
                        </ItemDescription>
                      </ItemContent>
                      {!done && !lockedReason && (
                        <ItemActions>
                          {instance ? (
                            <Button
                              size="sm"
                              disabled={busy}
                              onClick={() => model.submit(level)}
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
                              onClick={() => model.createInstance(level)}
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
              <DataList>
                <DataRow label="Ticket">{formatEth(ctf.ticketPrice)}</DataRow>
                <DataRow label="Cash prize">{formatEth(ctf.cashPrize)}</DataRow>
                <DataRow label="Caution de l'organisateur">
                  {formatEth(ctf.bond)}
                </DataRow>
                <DataRow label="Podium">
                  {shares
                    .map((share) => formatEth(share, { unit: false }))
                    .join(" / ")}{" "}
                  ETH
                </DataRow>
              </DataList>
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
              <CardTitle>
                {isOrganizer ? "Ton CTF" : "Ta participation"}
              </CardTitle>
              {(playerHas || isOrganizer) && (
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
              {isOrganizer ? (
                <p className="text-muted-foreground">
                  Tu organises ce CTF. Ta caution reste bloquée jusqu&apos;à la
                  fin ; tu la récupères dans « Mes gains » si aucune triche
                  n&apos;est confirmée.
                </p>
              ) : playerHas ? (
                <DataList>
                  <DataRow label="Épreuves réussies">
                    {solvedCount} / {ctf.challenges}
                  </DataRow>
                  <DataRow label="Rang">
                    {myRank !== null
                      ? `${myRank} sur ${formatInt(players)}`
                      : "non classé"}
                  </DataRow>
                </DataList>
              ) : (
                <p className="text-muted-foreground">
                  {canBuy
                    ? "Ton ticket entre dans la cagnotte. Il est remboursé si personne ne réussit ou si la triche est confirmée."
                    : "Les inscriptions sont fermées."}
                </p>
              )}
              <TxStatusAlert
                status={tx.status}
                hash={tx.hash}
                error={tx.error}
                isDemo={tx.isDemo}
              />
            </CardContent>
            {canBuy && !needsWallet && (
              <CardFooter>
                <Button
                  size="lg"
                  className="w-full"
                  disabled={busy}
                  onClick={model.buyTicket}
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
            {canRefund && (
              <CardFooter>
                <Button
                  size="lg"
                  className="w-full"
                  disabled={busy}
                  onClick={model.claimRefund}
                >
                  {pendingOn("refund") ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <TicketIcon data-icon="inline-start" />
                  )}
                  Récupérer mon ticket · {formatEth(ctf.ticketPrice)}
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
    </div>
  )
}

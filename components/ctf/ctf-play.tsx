"use client"

import Link from "next/link"
import {
  ArrowDownToLineIcon,
  CircleCheckIcon,
  FlagIcon,
  LinkIcon,
  SearchXIcon,
  ShieldCheckIcon,
  TicketIcon,
  VaultIcon,
} from "lucide-react"
import { baseSepolia } from "viem/chains"

import { remainingLabel } from "@/components/ctf/ctf-card"
import { CtfTimeline } from "@/components/ctf/ctf-timeline"
import { FactoryVerificationBadge } from "@/components/ctf/factory-verification-badge"
import { StatusPill } from "@/components/ctf/status-pill"
import { VulnTag } from "@/components/ctf/vuln-tag"
import { DisputeCard } from "@/components/dispute/dispute-card"
import { ChainError, ChainLoading } from "@/components/onchain/chain-state"
import { TxStatusAlert } from "@/components/onchain/tx-status"
import { DataList, DataRow } from "@/components/site/data-list"
import { AddressDisplay } from "@/components/ui/address-display"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ConnectWallet } from "@/components/ui/connect-wallet"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
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
import {
  useCtfPlay,
  type CtfPlayModel,
  type PlayAction,
  type PlayChallenge,
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

const placeLabels = ["1er", "2e", "3e"]

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
    ctf,
    challenges,
    players,
    pool,
    shares,
    board,
    myRank,
    solvedCount,
    hasTicket,
    isOrganizer,
    role,
    dispute,
    step,
    canFinalize,
    needsWallet,
    tx,
    action,
    vaults,
  } = model
  const busy = tx.status === "signing" || tx.status === "confirming"
  const playing = ctf.status === "running"

  const pendingOn = (kind: PlayAction["kind"], level?: number) =>
    busy &&
    action?.kind === kind &&
    (level === undefined || ("level" in action && action.level === level))
  const pendingVault = (kind: "bind" | "recover", factory: string) =>
    busy &&
    action?.kind === kind &&
    "factory" in action &&
    action.factory.toLowerCase() === factory.toLowerCase()

  const lockedReason = needsWallet
    ? "Connecte ton wallet pour jouer."
    : !hasTicket
      ? isOrganizer
        ? "Tu organises ce CTF : tu ne peux pas jouer."
        : "Achète un ticket pour jouer."
      : ctf.status === "open"
        ? `Les épreuves ouvrent dans ${formatRemaining(ctf.remaining)}.`
        : !playing
          ? "Le CTF est terminé : plus de soumission possible."
          : undefined

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <StatusPill status={ctf.status} />
            <span className="text-sm text-muted-foreground tabular-nums">
              {remainingLabel(ctf)}
            </span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            {ctf.title}
          </h1>
          <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
            {ctf.challenges} épreuve{ctf.challenges > 1 ? "s" : ""} · organisé
            par
            <AddressDisplay
              address={ctf.organizer}
              chainId={baseSepolia.id}
              addressClassName="font-mono text-sm text-foreground"
            />
          </p>
        </div>
        <CtfTimeline ctf={ctf} />
      </header>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start lg:gap-8">
        <div className="flex flex-col gap-10">
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
          {!tx.isDemo && ctf.status === "contestation" && (
            <Card>
              <CardHeader>
                <CardTitle>Contestation</CardTitle>
                <CardDescription>
                  {ctf.remaining > 0
                    ? `Fenêtre de contestation ouverte encore ${formatRemaining(ctf.remaining)}. L'ouverture d'un litige arrive avec la prochaine version du contrat.`
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

          {vaults.length > 0 && (
            <section aria-labelledby="vaults" className="flex flex-col gap-4">
              <SectionTitle
                id="vaults"
                description={`Chaque joueur reçoit un coffre de ${formatEth(vaults[0].needed / BigInt(ctf.maxPlayers))} pris sur ces fonds. Ce qu'il vide, il le garde ; tu récupères le reste après la fin du CTF.`}
              >
                Ton Coffre
              </SectionTitle>
              <ul className="divide-y rounded-xl border bg-card">
                {vaults.map((vault) => (
                  <li
                    key={vault.factory}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
                  >
                    <VaultIcon
                      aria-hidden
                      className="hidden size-5 shrink-0 text-muted-foreground sm:block"
                    />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <AddressDisplay
                          address={vault.factory}
                          chainId={baseSepolia.id}
                          addressClassName="font-mono text-sm"
                        />
                        {vault.bound ? (
                          <Badge variant="success">Lié au CTF</Badge>
                        ) : (
                          <Badge variant="warning">Pas encore lié</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Solde : {formatEth(vault.balance)}
                        {!vault.bound &&
                          (vault.funded
                            ? ". Lie-le pour que les joueurs puissent créer leur instance."
                            : `. Il faut ${formatEth(vault.needed)} pour le lier.`)}
                      </p>
                    </div>
                    {(vault.canBind || vault.canRecover) && (
                      <div className="flex shrink-0 gap-2">
                        {vault.canBind && (
                          <Button
                            size="sm"
                            disabled={busy}
                            onClick={() => model.bindVault(vault.factory)}
                          >
                            {pendingVault("bind", vault.factory) ? (
                              <Spinner data-icon="inline-start" />
                            ) : (
                              <LinkIcon data-icon="inline-start" />
                            )}
                            Lier au CTF
                          </Button>
                        )}
                        {vault.canRecover && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => model.recoverVault(vault.factory)}
                          >
                            {pendingVault("recover", vault.factory) ? (
                              <Spinner data-icon="inline-start" />
                            ) : (
                              <ArrowDownToLineIcon data-icon="inline-start" />
                            )}
                            Récupérer le reste
                          </Button>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="challenges" className="flex flex-col gap-4">
            <SectionTitle
              id="challenges"
              aside={
                hasTicket ? (
                  <span className="text-sm text-muted-foreground tabular-nums">
                    {solvedCount} / {ctf.challenges} réussie
                    {solvedCount > 1 ? "s" : ""}
                  </span>
                ) : undefined
              }
              description={
                lockedReason ??
                `Crée ton instance, exploite-la, puis demande la vérification : le contrat appelle validateInstance, pas de flag à recopier.${tx.isDemo ? " En démo, la vérification réussit toujours." : ""}`
              }
            >
              Épreuves
            </SectionTitle>
            <ol className="divide-y rounded-xl border bg-card">
              {challenges.map((challenge, level) => (
                <ChallengeRow
                  key={challenge.key}
                  challenge={challenge}
                  level={level}
                  playing={playing}
                  locked={!!lockedReason}
                  busy={busy}
                  pendingInstance={pendingOn("instance", level)}
                  pendingSubmit={pendingOn("submit", level)}
                  onCreate={() => model.createInstance(level)}
                  onSubmit={() => model.submit(level)}
                />
              ))}
            </ol>
          </section>

          <section aria-labelledby="ranking" className="flex flex-col gap-4">
            <SectionTitle
              id="ranking"
              description="1 point par épreuve. À égalité, la dernière réussite la plus tôt passe devant. Le podium se partage la cagnotte."
            >
              Classement
            </SectionTitle>
            <ol className="grid gap-3 sm:grid-cols-3">
              {placeLabels.map((label, index) => {
                const holder = board[index]
                const share = shares[index]
                return (
                  <li
                    key={label}
                    className={cn(
                      "flex flex-col gap-3 rounded-xl border bg-card p-4",
                      index === 0 && "border-primary/40"
                    )}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        className={cn(
                          "text-sm font-medium",
                          index === 0 ? "text-primary-text" : "text-foreground"
                        )}
                      >
                        {label}
                      </span>
                      <span className="text-lg font-semibold tabular-nums">
                        {share !== undefined ? formatEth(share) : "—"}
                      </span>
                    </div>
                    <div className="flex min-h-5 items-center gap-2 text-sm">
                      {holder ? (
                        <>
                          <span className="truncate font-mono">
                            {truncateAddress(holder.address)}
                          </span>
                          {holder.isMe && <Badge variant="brand">Toi</Badge>}
                          <span className="ml-auto text-muted-foreground tabular-nums">
                            {holder.score} / {ctf.challenges}
                          </span>
                        </>
                      ) : (
                        <span className="text-muted-foreground">
                          Place libre
                        </span>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
            {board.length > 3 && (
              <div className="rounded-xl border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16 pl-4">Rang</TableHead>
                      <TableHead>Joueur</TableHead>
                      <TableHead className="pr-4 text-right">Épreuves</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {board.slice(3).map((entry) => (
                      <TableRow
                        key={entry.address}
                        data-state={entry.isMe ? "selected" : undefined}
                      >
                        <TableCell className="pl-4 font-medium tabular-nums">
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
                        <TableCell className="pr-4 text-right tabular-nums">
                          {entry.score} / {ctf.challenges}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {board.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Personne n&apos;a encore marqué : le podium se remplit à chaque
                épreuve réussie.
              </p>
            )}
          </section>
        </div>

        {/* Sur mobile, la cagnotte et l'action principale passent avant les épreuves. */}
        <aside className="order-first flex flex-col gap-5 rounded-xl border bg-card p-5 lg:sticky lg:top-20 lg:order-none">
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Cagnotte</span>
            <span className="text-3xl font-semibold tracking-tight tabular-nums">
              {formatEth(pool)}
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatEth(ctf.cashPrize, { unit: false })} de cash prize +{" "}
              {formatInt(players)} ticket{players > 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <Progress
              value={(players / ctf.maxPlayers) * 100}
              aria-label="Places vendues"
            />
            <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
              <span>
                {formatInt(players)} / {formatInt(ctf.maxPlayers)} joueurs
              </span>
              <span>
                {formatInt(Math.max(ctf.maxPlayers - players, 0))} places
                libres
              </span>
            </div>
          </div>

          {(hasTicket || isOrganizer) && (
            <div className="flex flex-col gap-3 rounded-lg bg-muted/50 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">
                  {isOrganizer ? "Ton CTF" : "Ta participation"}
                </span>
                <Badge
                  variant={toneVariant[step.tone]}
                  className="h-auto py-0.5 text-right whitespace-normal"
                >
                  {step.label}
                </Badge>
              </div>
              {isOrganizer ? (
                <p className="text-sm text-muted-foreground">
                  Ta caution reste bloquée jusqu&apos;à la fin ; tu la
                  récupères dans « Mes gains » si aucune triche n&apos;est
                  confirmée.
                </p>
              ) : (
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
              )}
            </div>
          )}

          <PrimaryAction model={model} pendingOn={pendingOn} />

          <TxStatusAlert
            status={tx.status}
            hash={tx.hash}
            error={tx.error}
            isDemo={tx.isDemo}
          />

          <Separator />

          <DataList>
            <DataRow label="Ticket">{formatEth(ctf.ticketPrice)}</DataRow>
            <DataRow label="Cash prize">{formatEth(ctf.cashPrize)}</DataRow>
            <DataRow
              label="Caution de l'organisateur"
              hint="Perdue si une triche est confirmée"
            >
              {formatEth(ctf.bond)}
            </DataRow>
          </DataList>
        </aside>
      </div>
    </div>
  )
}

/** Titre de section de la colonne principale, avec sa phrase d'aide. */
function SectionTitle({
  id,
  description,
  aside,
  children,
}: {
  id: string
  description?: React.ReactNode
  aside?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id={id} className="text-xl font-semibold tracking-tight">
          {children}
        </h2>
        {aside}
      </div>
      {description && (
        <p className="max-w-prose text-sm text-pretty text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  )
}

function ChallengeRow({
  challenge,
  level,
  playing,
  locked,
  busy,
  pendingInstance,
  pendingSubmit,
  onCreate,
  onSubmit,
}: {
  challenge: PlayChallenge
  level: number
  playing: boolean
  locked: boolean
  busy: boolean
  pendingInstance: boolean
  pendingSubmit: boolean
  onCreate: () => void
  onSubmit: () => void
}) {
  const { done, instance } = challenge
  const canAct = !done && !locked && !(challenge.blocked && !instance)

  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-x-5 sm:p-5">
      <span
        aria-hidden
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg border font-mono text-sm tabular-nums",
          done
            ? "border-success/40 bg-success/10 text-success-text"
            : "text-muted-foreground"
        )}
      >
        {done ? <CircleCheckIcon className="size-4" /> : level + 1}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-medium">
            <span className="sr-only">Épreuve {level + 1} : </span>
            {challenge.name}
          </h3>
          {challenge.vuln && <VulnTag vuln={challenge.vuln} />}
          {challenge.factory && (
            <FactoryVerificationBadge
              factory={challenge.factory}
              matchedByCode={challenge.matchedByCode}
            />
          )}
        </div>
        {challenge.goal && (
          <p className="text-sm text-pretty">{challenge.goal}</p>
        )}
        <p className="text-sm text-muted-foreground">
          {done ? (
            "Réussie : 1 point."
          ) : instance ? (
            <span className="flex flex-wrap items-center gap-x-2">
              Ton instance :
              <AddressDisplay
                address={instance}
                chainId={baseSepolia.id}
                truncate={false}
                addressClassName="font-mono text-xs break-all text-foreground"
              />
            </span>
          ) : challenge.blocked && playing ? (
            challenge.blocked
          ) : playing ? (
            "Pas encore d'instance."
          ) : (
            "Non résolue."
          )}
        </p>
      </div>
      {canAct && (
        <div className="col-start-2 sm:col-start-auto sm:pt-0.5">
          {instance ? (
            <Button size="sm" disabled={busy} onClick={onSubmit}>
              {pendingSubmit ? (
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
              onClick={onCreate}
            >
              {pendingInstance && <Spinner data-icon="inline-start" />}
              Créer mon instance
            </Button>
          )}
        </div>
      )}
      {done && (
        <Badge
          variant="success"
          className="col-start-2 self-start sm:col-start-auto"
        >
          Réussie
        </Badge>
      )}
    </li>
  )
}

/** L'action principale du panneau : connexion, ticket, remboursement ou retrait. */
function PrimaryAction({
  model,
  pendingOn,
}: {
  model: CtfPlayModel
  pendingOn: (kind: PlayAction["kind"]) => boolean
}) {
  const { ctf, canBuy, canRefund, needsWallet, step, tx, hasTicket } = model
  const busy = tx.status === "signing" || tx.status === "confirming"

  if (canBuy && needsWallet)
    return (
      <div className="flex flex-col gap-2">
        <ConnectWallet
          label="Connecter un wallet pour jouer"
          className="h-10 w-full justify-center"
        />
        <p className="text-xs text-muted-foreground">
          Ticket à {formatEth(ctf.ticketPrice)}, remboursé si personne ne
          réussit ou si la triche est confirmée.
        </p>
      </div>
    )

  if (canBuy)
    return (
      <div className="flex flex-col gap-2">
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
        <p className="text-xs text-muted-foreground">
          Ton ticket entre dans la cagnotte. Il est remboursé si personne ne
          réussit ou si la triche est confirmée.
        </p>
      </div>
    )

  if (canRefund)
    return (
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
    )

  if (step.tone === "money")
    return (
      <Link
        href="/gains"
        className={cn(buttonVariants({ size: "lg" }), "w-full")}
      >
        <ArrowDownToLineIcon data-icon="inline-start" />
        Retirer dans Mes gains
      </Link>
    )

  if (!hasTicket && !model.isOrganizer)
    return (
      <p className="text-sm text-muted-foreground">
        Les inscriptions sont fermées.
      </p>
    )

  return null
}

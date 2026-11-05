"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowDownToLineIcon,
  ExternalLinkIcon,
  PiggyBankIcon,
  WalletIcon,
} from "lucide-react"

import { StatusPill } from "@/components/ctf/status-pill"
import { TxStatusAlert } from "@/components/onchain/tx-status"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ConnectWallet } from "@/components/ui/connect-wallet"
import {
  Empty,
  EmptyContent,
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
  ItemTitle,
} from "@/components/ui/item"
import { Spinner } from "@/components/ui/spinner"
import { useMyCtfs } from "@/hooks/use-my-ctfs"
import { usePlatformTx } from "@/hooks/use-platform-tx"
import { gainLines } from "@/lib/ctf/gains"
import { nowSeconds } from "@/lib/ctf/params"
import { formatEth } from "@/lib/format"
import { withdrawals, type Withdrawal } from "@/lib/mock/gains"
import { explorerTxUrl } from "@/lib/site"

// Fuseau fixe : même rendu côté serveur et navigateur.
const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Europe/Paris",
})

export function GainsView() {
  const { playing, organizing, isDemo, needsWallet } = useMyCtfs()
  const tx = usePlatformTx()
  // Après un retrait : solde à zéro et retrait ajouté à l'historique.
  const [justWithdrawn, setJustWithdrawn] = useState<Withdrawal>()

  const lines = justWithdrawn ? [] : gainLines(playing, organizing)
  const owed = lines.reduce((sum, line) => sum + line.amount, BigInt(0))
  const history = justWithdrawn ? [justWithdrawn, ...withdrawals] : withdrawals
  const busy = tx.status === "signing" || tx.status === "confirming"

  if (needsWallet) {
    return (
      <Empty className="rounded-2xl border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <WalletIcon />
          </EmptyMedia>
          <EmptyTitle>Connecte ton wallet</EmptyTitle>
          <EmptyDescription>
            Le solde à retirer est lu dans le contrat pour ton adresse.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <ConnectWallet />
        </EmptyContent>
      </Empty>
    )
  }

  const withdraw = () => {
    const amount = owed
    tx.send(
      { functionName: "withdraw", args: [] },
      {
        onSuccess: () =>
          setJustWithdrawn({
            amount,
            date: new Date(nowSeconds() * 1000).toISOString(),
            hash: `0x${"0".repeat(64)}`,
          }),
      }
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
      <Card className="lg:sticky lg:top-20">
        <CardHeader>
          <CardDescription>Solde à retirer</CardDescription>
          <CardTitle className="text-4xl font-semibold tabular-nums">
            {formatEth(owed)}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Gains, remboursements et cautions s&apos;additionnent dans un seul
            solde. Un retrait envoie tout sur ton wallet ; seul le gas est à ta
            charge.
          </p>
          <TxStatusAlert
            status={tx.status}
            hash={tx.hash}
            error={tx.error}
            isDemo={tx.isDemo}
          />
        </CardContent>
        <CardFooter>
          <Button
            size="lg"
            className="w-full"
            disabled={busy || owed === BigInt(0)}
            onClick={withdraw}
          >
            {busy ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <ArrowDownToLineIcon data-icon="inline-start" />
            )}
            {owed > BigInt(0) ? `Retirer ${formatEth(owed)}` : "Rien à retirer"}
          </Button>
        </CardFooter>
      </Card>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>D&apos;où vient ce solde</CardTitle>
            <CardDescription>
              Les CTF terminés qui te doivent quelque chose.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lines.length > 0 ? (
              <ItemGroup className="gap-2">
                {lines.map((line) => (
                  <Item
                    key={line.ctf.id}
                    variant="outline"
                    render={<Link href={`/ctf/${line.ctf.id}`} />}
                  >
                    <ItemContent>
                      <ItemTitle>{line.ctf.title}</ItemTitle>
                      <ItemDescription>{line.reason}</ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <StatusPill status={line.ctf.status} />
                      <span className="font-medium tabular-nums">
                        {formatEth(line.amount)}
                      </span>
                    </ItemActions>
                  </Item>
                ))}
              </ItemGroup>
            ) : (
              <Empty className="border border-dashed">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <PiggyBankIcon />
                  </EmptyMedia>
                  <EmptyTitle>Rien à retirer pour l&apos;instant</EmptyTitle>
                  <EmptyDescription>
                    Tes gains apparaissent ici quand un CTF auquel tu participes
                    se termine.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Link
                    href="/play"
                    className={buttonVariants({ variant: "outline" })}
                  >
                    Voir mes parties
                  </Link>
                </EmptyContent>
              </Empty>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Retraits passés</CardTitle>
            <CardDescription>Lus dans l&apos;event Withdrawn.</CardDescription>
          </CardHeader>
          <CardContent>
            <ItemGroup className="gap-2">
              {history.map((w) => (
                <Item key={`${w.hash}-${w.date}`} variant="muted">
                  <ItemContent>
                    <ItemTitle className="tabular-nums">
                      {formatEth(w.amount)}
                    </ItemTitle>
                    <ItemDescription>
                      {dateFormatter.format(new Date(w.date))}
                    </ItemDescription>
                  </ItemContent>
                  {!isDemo && (
                    <ItemActions>
                      <a
                        href={explorerTxUrl(w.hash)}
                        target="_blank"
                        rel="noreferrer"
                        className={buttonVariants({
                          variant: "ghost",
                          size: "sm",
                        })}
                      >
                        Basescan
                        <ExternalLinkIcon data-icon="inline-end" />
                      </a>
                    </ItemActions>
                  )}
                </Item>
              ))}
            </ItemGroup>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

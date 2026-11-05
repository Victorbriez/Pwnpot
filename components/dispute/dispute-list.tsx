import Link from "next/link"
import { ScaleIcon } from "lucide-react"

import { StatusPill } from "@/components/ctf/status-pill"
import { Badge } from "@/components/ui/badge"
import { SectionHeading } from "@/components/site/page-header"
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
  ItemTitle,
} from "@/components/ui/item"
import { contestBond, voteOutcome } from "@/lib/ctf/dispute"
import { formatEth, formatInt, formatRemaining } from "@/lib/format"
import {
  disputeRows,
  isDisputeInProgress,
  type DisputeRow,
} from "@/lib/mock/disputes"
import { ctfs } from "@/lib/mock/explore"

const rows = disputeRows(ctfs)
type Row = DisputeRow

const inProgress = rows.filter(isDisputeInProgress)
const contestable = rows.filter((r) => r.dispute.phase === "contestation")

export function DisputeList() {
  return (
    <div className="flex flex-col gap-10">
      <Section
        title="Litiges en cours"
        empty="Aucun litige en cours."
        rows={inProgress}
        describe={({ ctf, dispute }) => {
          const outcome = voteOutcome(dispute, ctf.players)
          return (
            <>
              <ItemDescription className="tabular-nums">
                {formatInt(dispute.cheatVotes)} « triche » ·{" "}
                {formatInt(dispute.fairVotes)} « pas de triche » · quorum{" "}
                {formatInt(outcome.quorum)}
              </ItemDescription>
              <ItemActions>
                <Badge variant={outcome.quorumReached ? "success" : "warning"}>
                  {outcome.quorumReached
                    ? "Quorum atteint"
                    : "Quorum pas atteint"}
                </Badge>
                <Badge variant="muted">
                  reste {formatRemaining(dispute.remaining)}
                </Badge>
              </ItemActions>
            </>
          )
        }}
      />
      <Section
        title="Encore contestables"
        empty="Aucun CTF dans sa fenêtre de contestation."
        rows={contestable}
        describe={({ ctf, dispute }) => (
          <>
            <ItemDescription className="tabular-nums">
              Caution de contestation {formatEth(contestBond(ctf.ticketPrice))}
            </ItemDescription>
            <ItemActions>
              <Badge variant="muted">
                reste {formatRemaining(dispute.remaining)}
              </Badge>
            </ItemActions>
          </>
        )}
      />
    </div>
  )
}

function Section({
  title,
  empty,
  rows,
  describe,
}: {
  title: string
  empty: string
  rows: Row[]
  describe: (row: Row) => React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4">
      <SectionHeading count={rows.length}>{title}</SectionHeading>
      {rows.length > 0 ? (
        <ItemGroup className="gap-3">
          {rows.map((row) => (
            <Item
              key={row.ctf.id}
              variant="outline"
              className="gap-x-6 gap-y-3 rounded-xl p-4"
              render={<Link href={`/ctf/${row.ctf.id}`} />}
            >
              <ItemContent className="min-w-48">
                <ItemTitle className="text-base">{row.ctf.title}</ItemTitle>
                <ItemDescription>
                  <StatusPill status={row.ctf.status} />
                </ItemDescription>
              </ItemContent>
              {describe(row)}
            </Item>
          ))}
        </ItemGroup>
      ) : (
        <Empty className="rounded-2xl border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ScaleIcon />
            </EmptyMedia>
            <EmptyTitle>{empty}</EmptyTitle>
            <EmptyDescription>
              Les CTF terminés apparaissent ici pendant 48 h.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </section>
  )
}

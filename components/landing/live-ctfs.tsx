import Link from "next/link"

import { VulnTag } from "@/components/ctf/vuln-tag"
import { formatEth, formatInt, formatRemaining } from "@/lib/format"
import type { Ctf } from "@/lib/mock/explore"

export function LiveCtfs({ ctfs }: { ctfs: Ctf[] }) {
  return (
    <ul className="flex flex-col border-t">
      {ctfs.map((ctf) => (
        <li key={ctf.id} className="border-b">
          <Link
            href="/explore"
            className="group grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-3 py-5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:grid-cols-[minmax(0,1fr)_9rem_7rem_8rem]"
          >
            <div className="flex min-w-0 flex-col gap-2">
              <span className="text-lg font-semibold transition-colors group-hover:text-primary-text">
                {ctf.title}
              </span>
              <span className="flex flex-wrap items-center gap-2">
                {ctf.vulns.map((vuln) => (
                  <VulnTag key={vuln} vuln={vuln} />
                ))}
                <span className="text-xs text-muted-foreground">
                  {formatInt(ctf.players)} joueurs
                </span>
              </span>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="font-mono text-xl font-semibold tabular-nums">
                {formatEth(ctf.prizePool)}
              </span>
              <span className="text-xs text-muted-foreground">cagnotte</span>
            </div>
            <div className="hidden flex-col items-end gap-0.5 md:flex">
              <span className="font-mono text-sm tabular-nums">
                {formatEth(ctf.ticketPrice)}
              </span>
              <span className="text-xs text-muted-foreground">ticket</span>
            </div>
            <div className="col-span-2 flex items-center justify-between gap-2 md:col-span-1 md:flex-col md:items-end md:gap-0.5">
              <span className="font-mono text-sm tabular-nums">
                {formatRemaining(ctf.remaining)}
              </span>
              <span className="text-xs text-muted-foreground">restant</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}

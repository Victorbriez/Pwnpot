"use client"

import Link from "next/link"

import { useCtfs } from "@/hooks/use-ctfs"
import { biggestRunning } from "@/lib/ctf/kpis"
import { formatEth, formatRemaining } from "@/lib/format"

/** « En ce moment, X ETH à prendre sur … » : le plus gros CTF en cours. */
export function LiveCtfLink() {
  const { ctfs } = useCtfs()
  const biggest = biggestRunning(ctfs)
  if (!biggest) return null

  return (
    <Link
      href="/explore"
      className="group flex w-fit items-center gap-3 rounded-lg text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span aria-hidden className="relative flex size-2">
        <span className="absolute inset-0 animate-ping rounded-full bg-success opacity-60 motion-reduce:animate-none" />
        <span className="relative size-2 rounded-full bg-success" />
      </span>
      <span className="text-muted-foreground">
        En ce moment,{" "}
        <span className="font-mono font-medium text-foreground tabular-nums">
          {formatEth(biggest.prizePool)}
        </span>{" "}
        à prendre sur{" "}
        <span className="font-medium text-foreground group-hover:underline group-hover:underline-offset-4">
          {biggest.title}
        </span>
        , encore {formatRemaining(biggest.remaining)}.
      </span>
    </Link>
  )
}

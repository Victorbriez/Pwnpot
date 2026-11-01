import Link from "next/link"

import { cn } from "@/lib/utils"

export function Logo({
  href = "/",
  className,
}: {
  href?: string
  className?: string
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
    >
      <span
        aria-hidden
        className="flex size-7.5 items-center justify-center rounded-lg bg-linear-135 from-chart-1 to-chart-2 font-mono text-sm font-bold text-primary-foreground"
      >
        P
      </span>
      <span className="text-lg font-bold tracking-tight">Pwnpot</span>
    </Link>
  )
}

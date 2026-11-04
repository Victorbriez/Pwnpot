import Image from "next/image"
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
        "flex items-center gap-2 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className
      )}
    >
      <Image
        src="/logo.png"
        alt=""
        width={36}
        height={36}
        className="size-9"
      />
      <span className="text-lg font-bold tracking-tight">Pwnpot</span>
    </Link>
  )
}

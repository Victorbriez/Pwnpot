"use client"

import { TriangleAlertIcon } from "lucide-react"
import { baseSepolia } from "viem/chains"
import { useConnection, useSwitchChain } from "wagmi"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/** Réseau attendu ; propose de basculer si le wallet est ailleurs. */
export function NetworkBadge({ className }: { className?: string }) {
  const { isConnected, chainId } = useConnection()
  const switchChain = useSwitchChain()

  if (isConnected && chainId !== baseSepolia.id) {
    return (
      <Button
        variant="outline"
        className={cn("text-warning-text", className)}
        disabled={switchChain.isPending}
        onClick={() => switchChain.mutate({ chainId: baseSepolia.id })}
      >
        <TriangleAlertIcon data-icon="inline-start" />
        Passer sur Base Sepolia
      </Button>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-lg border bg-card px-3 text-[0.8rem] font-medium text-secondary-foreground",
        className
      )}
    >
      <span aria-hidden className="size-2 rounded-full bg-success" />
      Base Sepolia
    </span>
  )
}

import { CircleCheckIcon, CircleXIcon, ExternalLinkIcon } from "lucide-react"
import type { Hash } from "viem"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import type { TxStatus } from "@/lib/onchain/tx-error"
import { explorerTxUrl } from "@/lib/site"

const titles: Record<Exclude<TxStatus, "idle">, string> = {
  signing: "Signe la transaction dans ton wallet",
  confirming: "En attente de confirmation",
  success: "Transaction confirmée",
  error: "Transaction échouée",
}

/** État d'une transaction : en attente, confirmée ou échouée, avec le lien Basescan. */
export function TxStatusAlert({
  status,
  hash,
  error,
  isDemo = false,
}: {
  status: TxStatus
  hash?: Hash
  error?: string
  isDemo?: boolean
}) {
  if (status === "idle") return null

  return (
    <Alert variant={status === "error" ? "destructive" : "default"}>
      {status === "success" ? (
        <CircleCheckIcon className="text-success-text" />
      ) : status === "error" ? (
        <CircleXIcon />
      ) : (
        <Spinner />
      )}
      <AlertTitle>{titles[status]}</AlertTitle>
      <AlertDescription>
        {error ? (
          <span className="font-mono text-xs break-all">{error}</span>
        ) : hash && isDemo ? (
          "Mode démo : aucune transaction réelle n'a été envoyée."
        ) : hash ? (
          <a
            href={explorerTxUrl(hash)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1"
          >
            Voir sur Basescan
            <ExternalLinkIcon className="size-3" />
          </a>
        ) : null}
      </AlertDescription>
    </Alert>
  )
}

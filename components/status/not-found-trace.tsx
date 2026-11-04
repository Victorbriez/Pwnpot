"use client"

import * as React from "react"

import { TraceLog } from "@/components/status/trace-log"

// La 404 est prérendue en statique : le chemin réel n'existe que dans le navigateur.
const noop = () => () => {}
const readPath = () => window.location.pathname
const serverPath = () => null

/** La page demandée, rejouée comme un appel qui revert. */
export function NotFoundTrace() {
  const path = React.useSyncExternalStore(noop, readPath, serverPath) ?? "/…"

  return (
    <TraceLog
      title="revert.log"
      label="Trace de la page demandée"
      stamp="Reverted"
      lines={[
        { level: "TX", message: `navigate("${path}")` },
        { level: "SYS", message: `router.resolve("${path}") → address(0)` },
        { level: "SYS", message: "staticcall(0x0000…0000, gas: 30000)" },
        { level: "ERR", message: `revert PageNotFound("${path}")` },
        { level: "SYS", message: "rollback : 0 slot modifié" },
        { level: "OK", message: "wallet intact · cagnotte intacte" },
      ]}
      summary={{ label: "Pages trouvées", value: "0" }}
    />
  )
}

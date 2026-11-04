"use client" // Les error boundaries sont des Client Components.

import { usePathname } from "next/navigation"
import Link from "next/link"

import { StatusScreen } from "@/components/status/status-screen"
import { TraceLog } from "@/components/status/trace-log"
import { Button, buttonVariants } from "@/components/ui/button"

export default function Error({
  error,
  retry,
}: {
  error: unknown
  retry: () => void
}) {
  const path = usePathname() || "/"
  // En prod, Next masque le message des erreurs serveur et ne donne qu'un identifiant.
  const digest =
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string"
      ? error.digest
      : null

  return (
    <StatusScreen
      code="0x1F4"
      eyebrow="Erreur 500 · Panic(0x01)"
      title="Le site a paniqué."
      description="Une erreur inattendue a interrompu l'affichage de cette page. Rien n'est parti de ton wallet : aucune transaction n'est envoyée sans ta signature."
      actions={
        <>
          <Button size="lg" onClick={() => retry()}>
            Réessayer
          </Button>
          <Link
            href="/"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Retour à l&apos;accueil
          </Link>
        </>
      }
      hint="Si ça recommence, recharge la page ou reviens dans quelques minutes."
      aside={
        <TraceLog
          title="panic.log"
          label="Trace de l'erreur"
          stamp="Panic"
          lines={[
            { level: "TX", message: `render("${path}")` },
            { level: "ERR", message: "Panic(0x01) : assertion échouée" },
            ...(digest
              ? [{ level: "SYS" as const, message: `digest : ${digest}` }]
              : []),
            { level: "SYS", message: "aucune transaction envoyée" },
            { level: "OK", message: "wallet intact · cagnotte intacte" },
          ]}
          summary={{ label: "Pages rendues", value: "0" }}
        />
      }
    />
  )
}

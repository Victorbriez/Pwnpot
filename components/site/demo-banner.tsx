import { FlaskConicalIcon } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { ctfPlatformAddress } from "@/lib/onchain/ctf-platform"

/**
 * Bande unique sous le header tant que CTFPlatform n'est pas déployé :
 * les pages n'ont pas à le rappeler chacune.
 */
export function DemoBanner() {
  if (ctfPlatformAddress !== undefined) return null
  return (
    <Alert className="rounded-none border-x-0 border-t-0 bg-warning/10 px-0 py-2 text-warning-text">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-2 px-4 sm:px-6 lg:px-12">
        <FlaskConicalIcon aria-hidden className="size-4 shrink-0" />
        <AlertDescription className="text-warning-text">
          <strong className="font-semibold">Mode démo.</strong> CTFPlatform
          n&apos;est pas encore déployé : les CTF et les transactions sont
          simulés.
        </AlertDescription>
      </div>
    </Alert>
  )
}

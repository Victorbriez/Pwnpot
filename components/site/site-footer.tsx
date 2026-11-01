import { Logo } from "@/components/site/logo"
import { Separator } from "@/components/ui/separator"

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-12">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <p className="max-w-md text-sm text-muted-foreground">
            CTF smart contracts sur Base Sepolia. Testnet uniquement : aucun
            fonds réel n&apos;est en jeu.
          </p>
        </div>
        <Separator />
        <p className="text-xs text-muted-foreground">
          Les cagnottes, tickets et cautions sont gérés par le contrat, sans
          administrateur.
        </p>
      </div>
    </footer>
  )
}

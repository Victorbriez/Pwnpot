import Link from "next/link"

import { Logo } from "@/components/site/logo"
import { ThemeToggle } from "@/components/site/theme-toggle"
import { buttonVariants } from "@/components/ui/button"
import { ConnectWallet } from "@/components/ui/connect-wallet"

const anchors = [
  { href: "#comment-ca-marche", label: "Comment ça marche" },
  { href: "#garanties", label: "Garanties" },
  { href: "#epreuves", label: "Épreuves" },
]

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-12">
        <Logo />
        <nav aria-label="Sections" className="hidden md:block">
          <ul className="flex items-center gap-7 text-sm font-medium">
            {anchors.map((anchor) => (
              <li key={anchor.href}>
                <a
                  href={anchor.href}
                  className="rounded-md text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {anchor.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <ConnectWallet label="Connecter" className="hidden sm:inline-flex" />
          <Link href="/explore" className={buttonVariants()}>
            Ouvrir l&apos;app
          </Link>
        </div>
      </div>
    </header>
  )
}

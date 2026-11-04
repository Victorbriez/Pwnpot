import { ExternalLinkIcon } from "lucide-react"
import Link from "next/link"

import { Logo } from "@/components/site/logo"
import { Separator } from "@/components/ui/separator"
import { explorerAddressUrl, site } from "@/lib/site"

type FooterLink = { label: string; href: string; external?: boolean }

const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: "Plateforme",
    links: [
      { label: "Accueil", href: "/" },
      { label: "Explorer les CTF", href: "/explore" },
      { label: "Où va l'argent", href: "/#comment-ca-marche" },
      { label: "Contester une triche", href: "/#litiges" },
      { label: "Les épreuves", href: "/#epreuves" },
    ],
  },
  {
    title: "Ressources",
    links: [
      {
        label: "ETH de test (faucets)",
        href: site.links.faucet,
        external: true,
      },
      { label: "Basescan Sepolia", href: site.links.explorer, external: true },
      ...(site.platformAddress
        ? [
            {
              label: "Contrat CTFPlatform",
              href: explorerAddressUrl(site.platformAddress),
              external: true,
            },
          ]
        : []),
      { label: "Arbitrage ERC-792", href: site.links.erc792, external: true },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "Mentions légales", href: "/mentions-legales" },
      { label: "Confidentialité", href: "/mentions-legales#confidentialite" },
      { label: "Avertissement", href: "/mentions-legales#avertissement" },
    ],
  },
]

const linkClass =
  "inline-flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-card/40">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-4 pt-16 pb-10 sm:px-6 lg:px-12">
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="col-span-2 flex max-w-xs flex-col gap-4 md:col-span-1">
            <Logo />
            <p className="text-sm text-pretty text-muted-foreground">
              CTF smart contracts payants. Les cagnottes, tickets et cautions
              sont gérés par le contrat, sans administrateur.
            </p>
            <span className="inline-flex w-fit items-center gap-2 rounded-md border bg-background px-2.5 py-1 text-xs font-medium text-secondary-foreground">
              <span aria-hidden className="size-1.5 rounded-full bg-success" />
              Base Sepolia, testnet
            </span>
          </div>

          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="mb-4 text-sm font-semibold">{column.title}</h2>
              <ul className="flex flex-col gap-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noreferrer"
                        className={linkClass}
                      >
                        {link.label}
                        <ExternalLinkIcon aria-hidden className="size-3.5" />
                        <span className="sr-only">(nouvel onglet)</span>
                      </a>
                    ) : (
                      <Link href={link.href} className={linkClass}>
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <Separator />

        <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {site.year} {site.name}. Projet {site.editor.school}, module{" "}
            {site.editor.module}.
          </p>
          <p>Testnet uniquement : l&apos;ETH utilisé n&apos;a aucune valeur.</p>
        </div>
      </div>
    </footer>
  )
}

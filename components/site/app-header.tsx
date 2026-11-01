"use client"

import { MenuIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { CtfSearch } from "@/components/site/ctf-search"
import { Logo } from "@/components/site/logo"
import { appNav, type NavLink } from "@/components/site/nav-links"
import { NetworkBadge } from "@/components/site/network-badge"
import { ThemeToggle } from "@/components/site/theme-toggle"
import { Button } from "@/components/ui/button"
import { ConnectWallet } from "@/components/ui/connect-wallet"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

function NavItem({
  link,
  active,
  className,
}: {
  link: NavLink
  active: boolean
  className?: string
}) {
  if (link.soon) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <span
              tabIndex={0}
              aria-disabled
              className={cn(
                "cursor-not-allowed rounded-md text-muted-foreground/60 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                className
              )}
            />
          }
        >
          {link.label}
        </TooltipTrigger>
        <TooltipContent>Bientôt disponible</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Link
      href={link.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-md text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=page]:text-foreground",
        className
      )}
    >
      {link.label}
    </Link>
  )
}

export function AppHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-12">
        <Logo href="/explore" />

        <nav aria-label="Navigation principale" className="hidden lg:block">
          <ul className="flex items-center gap-7 text-sm font-medium">
            {appNav.map((link) => (
              <li key={link.href}>
                <NavItem link={link} active={pathname === link.href} />
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <CtfSearch className="hidden md:inline-flex" />
          <NetworkBadge className="hidden sm:inline-flex" />
          <ThemeToggle />
          <ConnectWallet label="Connecter" />
          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Ouvrir le menu"
                />
              }
            >
              <MenuIcon />
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav aria-label="Navigation mobile" className="px-4">
                <ul className="flex flex-col gap-1 text-base font-medium">
                  {appNav.map((link) => (
                    <li key={link.href}>
                      <NavItem
                        link={link}
                        active={pathname === link.href}
                        className="block py-2.5"
                      />
                    </li>
                  ))}
                </ul>
              </nav>
              <div className="flex flex-col gap-2 px-4">
                <CtfSearch className="md:hidden" />
                <NetworkBadge className="sm:hidden" />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

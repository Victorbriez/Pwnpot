"use client"

import { useState } from "react"
import { MenuIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { CtfSearch } from "@/components/site/ctf-search"
import { Logo } from "@/components/site/logo"
import {
  appNav,
  isActive,
  isGroup,
  type NavGroup,
  type NavLink,
} from "@/components/site/nav-links"
import { NetworkBadge } from "@/components/site/network-badge"
import { ThemeToggle } from "@/components/site/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConnectWallet } from "@/components/ui/connect-wallet"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useNavBadges, type NavBadgeInfo } from "@/hooks/use-nav-badges"
import { cn } from "@/lib/utils"

// Lien de la barre : même style que les déclencheurs de menu.
const barLinkClass = cn(
  navigationMenuTriggerStyle(),
  "text-muted-foreground hover:text-foreground data-active:bg-transparent data-active:text-foreground"
)

type Badges = ReturnType<typeof useNavBadges>

function badgeOf(link: NavLink, badges: Badges) {
  return link.badge ? badges[link.badge] : undefined
}

function groupActive(pathname: string, group: NavGroup) {
  return group.links.some((link) => isActive(pathname, link.href, group.links))
}

function NavCount({ info }: { info: NavBadgeInfo }) {
  return (
    <Badge variant={info.variant} className="tabular-nums">
      <span aria-hidden>{info.label}</span>
      <span className="sr-only">{info.srLabel}</span>
    </Badge>
  )
}

/** Point sur un menu quand une pastille attend à l'intérieur. */
function PendingDot() {
  return (
    <>
      <span aria-hidden className="ml-1.5 size-1.5 rounded-full bg-primary" />
      <span className="sr-only">(actions en attente)</span>
    </>
  )
}

function DesktopNav({
  pathname,
  badges,
}: {
  pathname: string
  badges: Badges
}) {
  return (
    <NavigationMenu
      aria-label="Navigation principale"
      className="hidden lg:flex"
    >
      <NavigationMenuList className="gap-1">
        {appNav.map((entry) =>
          isGroup(entry) ? (
            <NavigationMenuItem key={entry.label}>
              <NavigationMenuTrigger
                className={cn(
                  "text-muted-foreground hover:text-foreground data-popup-open:text-foreground",
                  groupActive(pathname, entry) && "text-foreground"
                )}
              >
                {entry.label}
                {entry.links.some((link) => badgeOf(link, badges)) && (
                  <PendingDot />
                )}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-80 gap-1 p-1">
                  {entry.links.map((link) => (
                    <li key={link.href}>
                      <GroupLink
                        link={link}
                        active={isActive(pathname, link.href, entry.links)}
                        badge={badgeOf(link, badges)}
                      />
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          ) : (
            <NavigationMenuItem key={entry.href}>
              <NavigationMenuLink
                active={isActive(pathname, entry.href)}
                className={barLinkClass}
                render={<Link href={entry.href} />}
              >
                {entry.label}
              </NavigationMenuLink>
            </NavigationMenuItem>
          )
        )}
      </NavigationMenuList>
    </NavigationMenu>
  )
}

function GroupLink({
  link,
  active,
  badge,
}: {
  link: NavLink
  active: boolean
  badge?: NavBadgeInfo
}) {
  const Icon = link.icon
  return (
    <NavigationMenuLink
      active={active}
      className="items-start gap-3"
      render={<Link href={link.href} />}
    >
      {Icon && <Icon className="mt-0.5 text-muted-foreground" />}
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="flex items-center justify-between gap-2 font-medium">
          {link.label}
          {badge && <NavCount info={badge} />}
        </span>
        <span className="text-xs text-muted-foreground">
          {link.description}
        </span>
      </span>
    </NavigationMenuLink>
  )
}

function MobileLink({
  link,
  active,
  onNavigate,
  badge,
}: {
  link: NavLink
  active: boolean
  onNavigate: () => void
  badge?: NavBadgeInfo
}) {
  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className="flex items-center justify-between gap-2 rounded-md py-2 text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:text-foreground"
    >
      {link.label}
      {badge && <NavCount info={badge} />}
    </Link>
  )
}

function MobileNav({
  pathname,
  badges,
  onNavigate,
}: {
  pathname: string
  badges: Badges
  onNavigate: () => void
}) {
  const links = appNav.filter((entry): entry is NavLink => !isGroup(entry))
  const groups = appNav.filter(isGroup)
  return (
    <nav
      aria-label="Navigation mobile"
      className="flex flex-col gap-4 px-4 text-base font-medium"
    >
      <ul className="flex flex-col">
        {links.map((link) => (
          <li key={link.href}>
            <MobileLink
              link={link}
              active={isActive(pathname, link.href)}
              onNavigate={onNavigate}
            />
          </li>
        ))}
      </ul>
      {groups.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <Separator className="mb-3" />
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {group.label}
          </p>
          <ul className="flex flex-col">
            {group.links.map((link) => (
              <li key={link.href}>
                <MobileLink
                  link={link}
                  active={isActive(pathname, link.href, group.links)}
                  onNavigate={onNavigate}
                  badge={badgeOf(link, badges)}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

export function AppHeader() {
  const pathname = usePathname()
  const badges = useNavBadges()
  // Le menu latéral se ferme quand on choisit une page.
  const [menuOpen, setMenuOpen] = useState(false)
  const close = () => setMenuOpen(false)

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-12">
        <Logo />
        <DesktopNav pathname={pathname} badges={badges} />

        <div className="ml-auto flex items-center gap-2">
          <CtfSearch className="hidden md:inline-flex" />
          <NetworkBadge className="hidden xl:inline-flex" />
          <ThemeToggle />
          <ConnectWallet label="Connecter" />
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
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
              <MobileNav
                pathname={pathname}
                badges={badges}
                onNavigate={close}
              />
              <div className="flex flex-col gap-2 px-4">
                <CtfSearch className="md:hidden" />
                <NetworkBadge className="xl:hidden" />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

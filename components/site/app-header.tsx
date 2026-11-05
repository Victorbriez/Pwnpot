"use client"

import { useState } from "react"
import { MenuIcon, PlusIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { CtfSearch } from "@/components/site/ctf-search"
import { Logo } from "@/components/site/logo"
import {
  createLink,
  isActive,
  personalNav,
  primaryNav,
  type NavLink,
} from "@/components/site/nav-links"
import { NetworkBadge } from "@/components/site/network-badge"
import { ThemeToggle } from "@/components/site/theme-toggle"
import { Button, buttonVariants } from "@/components/ui/button"
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
import { cn } from "@/lib/utils"

// Lien de la barre : même style que le déclencheur « Mon espace ».
const barLinkClass = cn(
  navigationMenuTriggerStyle(),
  "text-muted-foreground hover:text-foreground data-active:bg-transparent data-active:text-foreground"
)

function DesktopNav({ pathname }: { pathname: string }) {
  const personalActive = personalNav.some((link) =>
    isActive(pathname, link.href)
  )
  return (
    <NavigationMenu
      aria-label="Navigation principale"
      className="hidden lg:flex"
    >
      <NavigationMenuList className="gap-1">
        {primaryNav.map((link) => (
          <NavigationMenuItem key={link.href}>
            <NavigationMenuLink
              active={isActive(pathname, link.href)}
              className={barLinkClass}
              render={<Link href={link.href} />}
            >
              {link.label}
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
        <NavigationMenuItem>
          <NavigationMenuTrigger
            className={cn(
              "text-muted-foreground hover:text-foreground data-popup-open:text-foreground",
              personalActive && "text-foreground"
            )}
          >
            Mon espace
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-80 gap-1 p-1">
              {personalNav.map((link) => (
                <li key={link.href}>
                  <PersonalLink link={link} pathname={pathname} />
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}

function PersonalLink({ link, pathname }: { link: NavLink; pathname: string }) {
  const Icon = link.icon
  return (
    <NavigationMenuLink
      active={isActive(pathname, link.href)}
      className="items-start gap-3"
      render={<Link href={link.href} />}
    >
      {Icon && <Icon className="mt-0.5 text-muted-foreground" />}
      <span className="flex flex-col gap-0.5">
        <span className="font-medium">{link.label}</span>
        <span className="text-xs text-muted-foreground">
          {link.description}
        </span>
      </span>
    </NavigationMenuLink>
  )
}

function MobileLink({
  link,
  pathname,
  onNavigate,
}: {
  link: NavLink
  pathname: string
  onNavigate: () => void
}) {
  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      aria-current={isActive(pathname, link.href) ? "page" : undefined}
      className="block rounded-md py-2 text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:text-foreground"
    >
      {link.label}
    </Link>
  )
}

export function AppHeader() {
  const pathname = usePathname()
  // Le menu latéral se ferme quand on choisit une page.
  const [menuOpen, setMenuOpen] = useState(false)
  const close = () => setMenuOpen(false)

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-12">
        <Logo />
        <DesktopNav pathname={pathname} />

        <div className="ml-auto flex items-center gap-2">
          <CtfSearch className="hidden md:inline-flex" />
          <NetworkBadge className="hidden 2xl:inline-flex" />
          <ThemeToggle />
          <Link
            href={createLink.href}
            className={cn(buttonVariants(), "hidden md:inline-flex")}
          >
            <PlusIcon data-icon="inline-start" />
            {createLink.label}
          </Link>
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
              <nav
                aria-label="Navigation mobile"
                className="flex flex-col gap-4 px-4 text-base font-medium"
              >
                <ul className="flex flex-col">
                  {primaryNav.map((link) => (
                    <li key={link.href}>
                      <MobileLink
                        link={link}
                        pathname={pathname}
                        onNavigate={close}
                      />
                    </li>
                  ))}
                </ul>
                <Separator />
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Mon espace
                  </p>
                  <ul className="flex flex-col">
                    {personalNav.map((link) => (
                      <li key={link.href}>
                        <MobileLink
                          link={link}
                          pathname={pathname}
                          onNavigate={close}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href={createLink.href}
                  onClick={close}
                  className={buttonVariants({ className: "w-full" })}
                >
                  <PlusIcon data-icon="inline-start" />
                  Organiser un CTF
                </Link>
              </nav>
              <div className="flex flex-col gap-2 px-4">
                <CtfSearch className="md:hidden" />
                <NetworkBadge className="2xl:hidden" />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

export type NavLink = {
  href: string
  label: string
  /** Page pas encore construite : le lien est affiché mais inactif. */
  soon?: boolean
}

export const appNav: NavLink[] = [
  { href: "/", label: "Accueil" },
  { href: "/explore", label: "Explorer" },
  { href: "/my-ctfs", label: "Mes CTF" },
  { href: "/disputes", label: "Litiges" },
  { href: "/create", label: "Organiser" },
  { href: "/docs", label: "Docs", soon: true },
]

export type NavLink = {
  href: string
  label: string
  /** Page pas encore construite : le lien est affiché mais inactif. */
  soon?: boolean
}

export const appNav: NavLink[] = [
  { href: "/explore", label: "Explorer" },
  { href: "/my-ctfs", label: "Mes CTF", soon: true },
  { href: "/disputes", label: "Litiges", soon: true },
  { href: "/create", label: "Organiser", soon: true },
  { href: "/docs", label: "Docs", soon: true },
]

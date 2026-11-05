import { ArrowDownToLineIcon, SwordsIcon, type LucideIcon } from "lucide-react"

export type NavLink = {
  href: string
  label: string
  /** Sous-titre affiché dans le menu « Mon espace ». */
  description?: string
  icon?: LucideIcon
}

/** Pages publiques, toujours visibles dans la barre. */
export const primaryNav: NavLink[] = [
  { href: "/explore", label: "Explorer" },
  { href: "/disputes", label: "Litiges" },
]

/** Pages liées à l'adresse connectée, regroupées sous « Mon espace ». */
export const personalNav: NavLink[] = [
  {
    href: "/my-ctfs",
    label: "Mes CTF",
    description: "Ceux que tu joues et ceux que tu organises.",
    icon: SwordsIcon,
  },
  {
    href: "/gains",
    label: "Mes gains",
    description: "Ce qu'on te doit, à retirer en une fois.",
    icon: ArrowDownToLineIcon,
  },
]

/** Action principale, en bouton à droite de la barre. */
export const createLink: NavLink = { href: "/create", label: "Organiser" }

/** Actif sur la page et ses sous-pages. */
export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href)
}

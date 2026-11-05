import {
  ArrowDownToLineIcon,
  ScaleIcon,
  SwordsIcon,
  type LucideIcon,
} from "lucide-react"

/** Pastille affichée à côté d'un lien de « Mon espace ». */
export type NavBadge = "owed" | "disputes"

export type NavLink = {
  href: string
  label: string
  /** Sous-titre affiché dans le menu « Mon espace ». */
  description?: string
  icon?: LucideIcon
  badge?: NavBadge
}

/** Pages toujours visibles dans la barre. */
export const primaryNav: NavLink[] = [
  { href: "/explore", label: "Explorer" },
  { href: "/create", label: "Organiser" },
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
    badge: "owed",
  },
  {
    href: "/disputes",
    label: "Litiges",
    description: "Contester une triche, voter, faire appel.",
    icon: ScaleIcon,
    badge: "disputes",
  },
]

/** Actif sur la page et ses sous-pages. */
export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href)
}

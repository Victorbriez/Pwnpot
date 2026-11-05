import {
  ArrowDownToLineIcon,
  FlagIcon,
  PlusIcon,
  ScaleIcon,
  SwordsIcon,
  type LucideIcon,
} from "lucide-react"

/** Pastille affichée à côté d'un lien de menu. */
export type NavBadge = "owed" | "disputes"

export type NavLink = {
  href: string
  label: string
  /** Sous-titre affiché dans les menus déroulants. */
  description?: string
  icon?: LucideIcon
  badge?: NavBadge
}

export type NavGroup = { label: string; links: NavLink[] }

/** Entrée de la barre : lien direct ou menu déroulant. */
export type NavEntry = NavLink | NavGroup

export function isGroup(entry: NavEntry): entry is NavGroup {
  return "links" in entry
}

/** Barre de navigation, dans l'ordre d'affichage. */
export const appNav: NavEntry[] = [
  { href: "/explore", label: "Explorer" },
  {
    label: "Organiser",
    links: [
      {
        href: "/organize/new",
        label: "Nouveau CTF",
        description: "Choisis les épreuves, la cagnotte et la caution.",
        icon: PlusIcon,
      },
      {
        href: "/organize",
        label: "Mes CTF organisés",
        description: "Joueurs inscrits, cagnotte et prochaine étape.",
        icon: FlagIcon,
      },
    ],
  },
  {
    label: "Mon espace",
    links: [
      {
        href: "/play",
        label: "Mes parties",
        description: "Les CTF où tu as un ticket, et ta progression.",
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
    ],
  },
  { href: "/docs", label: "Doc" },
]

/** Actif sur la page et ses sous-pages, sans déborder sur un lien plus précis. */
export function isActive(pathname: string, href: string, siblings?: NavLink[]) {
  if (href === "/") return pathname === "/"
  if (pathname !== href && !pathname.startsWith(`${href}/`)) return false
  // « /organize » ne doit pas s'allumer sur « /organize/new ».
  return !siblings?.some(
    (other) =>
      other.href.length > href.length &&
      (pathname === other.href || pathname.startsWith(`${other.href}/`))
  )
}

import type { MetadataRoute } from "next"

import { site } from "@/lib/site"

// Pages publiques déjà construites. Ajouter ici chaque nouvelle page.
const pages: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/explore", priority: 0.8 },
  { path: "/mentions-legales", priority: 0.2 },
  { path: "/cgu", priority: 0.2 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map(({ path, priority }) => ({
    url: `${site.url}${path === "/" ? "" : path}`,
    priority,
  }))
}

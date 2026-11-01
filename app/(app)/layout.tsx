import { AppHeader } from "@/components/site/app-header"
import { SiteFooter } from "@/components/site/site-footer"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      {/* Chaque page gère sa largeur : la page d'accueil a des sections pleine largeur. */}
      <main id="contenu" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}

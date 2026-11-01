import { AppHeader } from "@/components/site/app-header"
import { SiteFooter } from "@/components/site/site-footer"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <main
        id="contenu"
        className="mx-auto w-full max-w-7xl flex-1 px-4 py-10 sm:px-6 lg:px-12 lg:py-12"
      >
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}

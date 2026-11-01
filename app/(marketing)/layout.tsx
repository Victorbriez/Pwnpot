import { ConnectRedirect } from "@/components/landing/connect-redirect"
import { MarketingHeader } from "@/components/site/marketing-header"
import { SiteFooter } from "@/components/site/site-footer"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <ConnectRedirect />
      <MarketingHeader />
      <main id="contenu" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}

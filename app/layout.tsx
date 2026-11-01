import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Web3Provider } from "@/components/web3-provider"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: { default: "Pwnpot, CTF smart contracts", template: "%s · Pwnpot" },
  description:
    "CTF smart contracts sur Base Sepolia : exploite ton instance, la réussite est vérifiée on-chain et la cagnotte est gardée par le contrat.",
}

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable
      )}
    >
      <body>
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
        >
          Aller au contenu
        </a>
        <ThemeProvider defaultTheme="dark">
          <Web3Provider>
            <TooltipProvider>{children}</TooltipProvider>
          </Web3Provider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}

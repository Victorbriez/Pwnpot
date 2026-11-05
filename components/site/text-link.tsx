import Link from "next/link"

import { cn } from "@/lib/utils"

/**
 * Lien dans un texte, même style partout. Page du site : `Link` de Next.
 * Site externe : nouvel onglet, annoncé aux lecteurs d'écran. `mailto:` :
 * lien simple.
 */
export function TextLink({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: React.ReactNode
}) {
  const classes = cn(
    "font-medium text-foreground underline underline-offset-4 transition-colors hover:text-primary",
    className
  )

  if (/^https?:\/\//.test(href)) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={classes}>
        {children}
        <span className="sr-only"> (nouvel onglet)</span>
      </a>
    )
  }
  if (href.startsWith("mailto:")) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    )
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  )
}

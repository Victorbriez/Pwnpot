import { bytecode } from "@/components/landing/final-cta"
import { AppHeader } from "@/components/site/app-header"
import { SiteFooter } from "@/components/site/site-footer"

/**
 * Gabarit des pages 404 et erreur : code en hexa qui glitch, texte et actions
 * à gauche, terminal à droite. Header et footer inclus, car ces pages
 * s'affichent hors du layout (app).
 */
export function StatusScreen({
  code,
  eyebrow,
  title,
  description,
  actions,
  hint,
  aside,
}: {
  code: string
  eyebrow: string
  title: string
  description: React.ReactNode
  actions: React.ReactNode
  hint?: React.ReactNode
  aside: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <main
        id="contenu"
        className="relative isolate flex flex-1 items-center overflow-hidden"
      >
        <p
          aria-hidden
          className="absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_70%_40%,black_10%,transparent_65%)] font-mono text-[0.625rem] leading-4 break-all text-foreground/[0.06] select-none"
        >
          {bytecode}
        </p>
        <div
          aria-hidden
          className="absolute -top-40 -left-32 -z-10 size-[32rem] rounded-full bg-primary/20 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -right-24 -bottom-40 -z-10 size-[26rem] rounded-full bg-destructive/10 blur-3xl"
        />

        <div className="mx-auto grid w-full max-w-7xl items-center gap-16 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:px-12 lg:py-24">
          <div className="flex min-w-0 flex-col gap-8">
            <p className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
              <span
                aria-hidden
                className="size-2 rounded-full bg-destructive"
              />
              {eyebrow}
            </p>

            {/* Deux copies colorées qui glitchent par à-coups. */}
            <div
              aria-hidden
              className="relative -ml-1 w-fit font-mono text-[clamp(4.5rem,17vw,11rem)] leading-[0.85] font-semibold tracking-tighter select-none"
            >
              <span className="text-foreground">{code}</span>
              <span className="absolute inset-0 text-primary [clip-path:inset(100%_0_0_0)] motion-safe:animate-glitch-a">
                {code}
              </span>
              <span className="absolute inset-0 text-info [clip-path:inset(100%_0_0_0)] motion-safe:animate-glitch-b">
                {code}
              </span>
            </div>

            <div className="flex flex-col gap-4">
              <h1 className="text-4xl leading-[1.05] font-semibold tracking-tighter text-balance sm:text-5xl">
                {title}
              </h1>
              <p className="max-w-lg text-lg text-pretty text-muted-foreground">
                {description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">{actions}</div>

            {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
          </div>

          <div className="mx-auto w-full max-w-xl lg:mr-0">{aside}</div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

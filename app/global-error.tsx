"use client" // Les error boundaries sont des Client Components.

import "./globals.css"

// Filet de sécurité quand le layout racine lui-même plante : pas de thème, de
// wallet ni de header, car leurs providers ne sont pas disponibles ici.
export default function GlobalError({ retry }: { retry: () => void }) {
  return (
    <html lang="fr" className="dark">
      <body className="flex min-h-dvh items-center bg-background font-sans text-foreground antialiased">
        <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-16 sm:px-6">
          <p className="font-mono text-xs text-muted-foreground">
            Erreur critique · Panic(0x01)
          </p>
          <p
            aria-hidden
            className="font-mono text-7xl leading-none font-semibold tracking-tighter sm:text-8xl"
          >
            0x1F4
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Pwnpot n&apos;a pas pu démarrer.
          </h1>
          <p className="text-pretty text-muted-foreground">
            Rien n&apos;est parti de ton wallet. Réessaie, ou reviens dans
            quelques minutes.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => retry()}
              className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/80"
            >
              Réessayer
            </button>
            {/* Lien natif : le routeur client n'est peut-être plus utilisable. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="flex h-10 items-center rounded-lg border px-4 text-sm font-medium hover:bg-accent"
            >
              Retour à l&apos;accueil
            </a>
          </div>
        </main>
      </body>
    </html>
  )
}

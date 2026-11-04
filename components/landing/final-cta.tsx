import { HeroActions } from "@/components/landing/hero-actions"

// Début d'un bytecode EVM, répété : sert de texture, pas d'information.
export const bytecode =
  "608060405234801561001057600080fd5b506004361061004c5760003560e01c80633ccfd60b14610051578063d0e30db01461005b578063f8b2cb4f14610065575b600080fd5b610059610095565b005b6100636101a2565b005b61007f600480360381019061007a919061021c565b6101fd565b60405161008c9190610262565b60405180910390f35b60008060003373ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905060003373ffffffffffffffffffffffffffffffffffffffff1682604051".repeat(
    16
  )

export function FinalCta() {
  return (
    <div className="relative isolate overflow-hidden rounded-3xl border bg-card px-6 py-16 sm:px-12 lg:px-16 lg:py-20">
      <p
        aria-hidden
        className="absolute inset-0 -z-10 [mask-image:linear-gradient(to_left,black_20%,transparent_75%)] font-mono text-[0.625rem] leading-4 break-all text-foreground/[0.07] select-none"
      >
        {bytecode}
      </p>
      <div
        aria-hidden
        className="absolute -top-32 -right-24 -z-10 size-[28rem] rounded-full bg-primary/25 blur-3xl"
      />

      <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-xl flex-col gap-4">
          <h2 className="text-4xl leading-[1.05] font-semibold tracking-tighter text-balance sm:text-5xl">
            Ta première instance t&apos;attend.
          </h2>
          <p className="text-lg text-pretty text-muted-foreground">
            Connecte ton wallet, choisis un CTF et déploie ton instance. Le
            contrat se charge du reste.
          </p>
        </div>
        <HeroActions />
      </div>
    </div>
  )
}

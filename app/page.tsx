import { ConnectWallet } from "@/components/ui/connect-wallet"

export default function Page() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <span className="font-mono text-sm font-medium">Pwnpot</span>
        <ConnectWallet />
      </header>
      <main className="flex flex-1 flex-col gap-2 p-6 text-sm">
        <h1 className="font-medium">Plateforme de CTF smart contracts</h1>
        <p className="text-muted-foreground">
          Connecte ton wallet sur Base Sepolia pour commencer.
        </p>
      </main>
    </div>
  )
}

import Link from "next/link"

import { VulnTag } from "@/components/ctf/vuln-tag"
import { ConnectRedirect } from "@/components/landing/connect-redirect"
import { ContractListing } from "@/components/landing/contract-listing"
import { ExploitTrace } from "@/components/landing/exploit-trace"
import { HeroActions } from "@/components/landing/hero-actions"
import { LiveCtfs } from "@/components/landing/live-ctfs"
import { Settlement } from "@/components/landing/settlement"
import { formatEth, formatRemaining } from "@/lib/format"
import { ctfs, type Vuln } from "@/lib/mock/explore"

const challenges: { vuln: Vuln; title: string; goal: string; code: string }[] =
  [
    {
      vuln: "reentrancy",
      title: "Le coffre",
      goal: "Vide le coffre de tout son ETH.",
      code: `function withdraw() external {
  uint256 bal = balances[msg.sender];
  (bool ok,) = msg.sender.call{value: bal}("");
  require(ok);
  balances[msg.sender] = 0;
}`,
    },
    {
      vuln: "tx-origin",
      title: "Le propriétaire",
      goal: "Prends la place de l'owner.",
      code: `function changeOwner(address next) external {
  require(tx.origin == owner);
  owner = next;
}`,
    },
    {
      vuln: "storage",
      title: "Le cadenas",
      goal: "Déverrouille le contrat sans connaître le mot de passe.",
      code: `bytes32 private password;

function unlock(bytes32 guess) external {
  if (guess == password) locked = false;
}`,
    },
  ]

const liveCtfs = ctfs
  .filter((ctf) => ctf.status === "live")
  .sort((a, b) => (b.prizePool > a.prizePool ? 1 : -1))
const biggest = liveCtfs[0]

const section = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-12"

export default function HomePage() {
  return (
    <>
      <ConnectRedirect />

      {/* Hero */}
      <section
        className={`${section} grid items-center gap-14 pt-16 pb-24 lg:grid-cols-[1.05fr_1fr] lg:pt-24 lg:pb-32`}
      >
        <div className="flex flex-col gap-8">
          <h1 className="text-5xl leading-[1.02] font-semibold tracking-tighter sm:text-6xl lg:text-7xl">
            Trouve la faille.
            <br />
            Vide le contrat.
            <br />
            Garde la cagnotte.
          </h1>
          <p className="max-w-lg text-lg text-pretty text-muted-foreground">
            Des CTF smart contracts avec de l&apos;ETH à la clé. Tu exploites ta
            propre instance, la réussite est vérifiée on-chain, et seul le
            contrat tient la cagnotte.
          </p>
          <HeroActions />
          {biggest && (
            <Link
              href="/explore"
              className="group flex w-fit items-center gap-3 rounded-lg text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span aria-hidden className="relative flex size-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-success opacity-60 motion-reduce:animate-none" />
                <span className="relative size-2 rounded-full bg-success" />
              </span>
              <span className="text-muted-foreground">
                En ce moment,{" "}
                <span className="font-mono font-medium text-foreground tabular-nums">
                  {formatEth(biggest.prizePool)}
                </span>{" "}
                à prendre sur{" "}
                <span className="font-medium text-foreground group-hover:underline group-hover:underline-offset-4">
                  {biggest.title}
                </span>
                , encore {formatRemaining(biggest.remaining)}.
              </span>
            </Link>
          )}
        </div>
        <ExploitTrace />
      </section>

      {/* Où va l'argent */}
      <section
        id="comment-ca-marche"
        aria-labelledby="argent-titre"
        className="scroll-mt-16 border-t"
      >
        <div
          className={`${section} grid gap-12 py-24 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:py-32`}
        >
          <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
            <h2
              id="argent-titre"
              className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
            >
              Où va l&apos;argent
            </h2>
            <p className="max-w-md text-pretty text-muted-foreground">
              Cagnotte, tickets, caution : tout est déposé dans le contrat dès
              le départ. À la clôture, il n&apos;y a que trois issues possibles,
              et chacune est écrite dans le code.
            </p>
            <p className="max-w-md text-sm text-pretty text-muted-foreground">
              Personne ne reçoit de virement : chacun voit son solde crédité et
              le retire lui-même.
            </p>
          </div>
          <Settlement />
        </div>
      </section>

      {/* Ce que le contrat ne sait pas faire */}
      <section aria-labelledby="contrat-titre" className="border-t bg-card/40">
        <div
          className={`${section} grid gap-12 py-24 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:py-32`}
        >
          <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
            <h2
              id="contrat-titre"
              className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
            >
              Ce que le contrat ne sait pas faire
            </h2>
            <p className="max-w-md text-pretty text-muted-foreground">
              Pas d&apos;administrateur, pas de bouton d&apos;urgence, pas de
              mise à jour. Les fonctions qui permettraient de toucher à la
              cagnotte n&apos;existent tout simplement pas.
            </p>
          </div>
          <ContractListing />
        </div>
      </section>

      {/* Épreuves */}
      <section
        id="epreuves"
        aria-labelledby="epreuves-titre"
        className="scroll-mt-20 border-t"
      >
        <div className={`${section} flex flex-col gap-12 py-24 lg:py-32`}>
          <div className="flex max-w-2xl flex-col gap-3">
            <h2
              id="epreuves-titre"
              className="text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              Trois failles pour commencer
            </h2>
            <p className="text-pretty text-muted-foreground">
              Les épreuves de lancement. Le bug est dans l&apos;extrait, à toi
              de le trouver.
            </p>
          </div>
          <ul className="grid gap-6 xl:grid-cols-3">
            {challenges.map((challenge) => (
              <li
                key={challenge.vuln}
                className="flex flex-col overflow-hidden rounded-2xl border bg-card"
              >
                <div className="flex flex-col gap-3 p-6">
                  <VulnTag vuln={challenge.vuln} />
                  <h3 className="text-lg font-semibold">{challenge.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {challenge.goal}
                  </p>
                </div>
                <pre className="mt-auto border-t bg-muted/60 px-4 py-5 font-mono text-[0.72rem] leading-5 [overflow-wrap:anywhere] whitespace-pre-wrap text-secondary-foreground">
                  <code>{challenge.code}</code>
                </pre>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTF en cours */}
      <section aria-labelledby="live-titre" className="border-t">
        <div className={`${section} flex flex-col gap-10 py-24 lg:py-32`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <h2
              id="live-titre"
              className="text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              À prendre maintenant
            </h2>
            <Link
              href="/explore"
              className="text-sm font-medium underline-offset-4 hover:underline"
            >
              Tous les CTF
            </Link>
          </div>
          <LiveCtfs ctfs={liveCtfs.slice(0, 4)} />
          <HeroActions />
        </div>
      </section>
    </>
  )
}

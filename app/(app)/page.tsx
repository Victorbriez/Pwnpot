import Link from "next/link"

import { VulnTag } from "@/components/ctf/vuln-tag"
import { ConnectRedirect } from "@/components/landing/connect-redirect"
import { ContractListing } from "@/components/landing/contract-listing"
import { DisputeFlow } from "@/components/landing/dispute-flow"
import { ExploitTrace } from "@/components/landing/exploit-trace"
import { FinalCta } from "@/components/landing/final-cta"
import { HeroActions } from "@/components/landing/hero-actions"
import { Settlement } from "@/components/landing/settlement"
import { TrustList } from "@/components/landing/trust-list"
import { formatEth, formatRemaining } from "@/lib/format"
import { ctfs, type Vuln } from "@/lib/mock/explore"
import { TextLink } from "@/components/site/text-link"

// Les trois épreuves de docs/CHALLENGES.md.
const challenges: {
  vuln: Vuln
  title: string
  goal: string
  check: string
  code: string
}[] = [
  {
    vuln: "reentrancy",
    title: "Coffre",
    goal: "Vide le coffre de tout son ETH.",
    check: "address(instance).balance == 0",
    code: `function withdraw() external {
  uint256 bal = balances[msg.sender];
  (bool ok,) = msg.sender.call{value: bal}("");
  require(ok);
  balances[msg.sender] = 0;
}`,
  },
  {
    vuln: "tx-origin",
    title: "Usurpateur",
    goal: "Deviens le propriétaire du contrat.",
    check: "instance.owner() == player",
    code: `function changeOwner(address newOwner) external {
  if (tx.origin != msg.sender) {
    owner = newOwner;
  }
}`,
  },
  {
    vuln: "storage",
    title: "Coffre-fort à code",
    goal: "Déverrouille le contrat sans connaître le mot de passe.",
    check: "instance.locked() == false",
    code: `bool public locked = true;
bytes32 private password; // slot 1

function unlock(bytes32 attempt) external {
  if (attempt == password) locked = false;
}`,
  },
]

const liveCtfs = ctfs
  .filter((ctf) => ctf.status === "running")
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
              Cash prize, tickets, cautions : tout est déposé dans le contrat
              dès le départ. À la clôture, il n&apos;y a que quatre issues
              possibles, et chacune est écrite dans le code.
            </p>
            <p className="max-w-md text-sm text-pretty text-muted-foreground">
              Personne ne reçoit de virement : chacun voit son solde crédité et
              le retire lui-même.
            </p>
            <TextLink href="/docs" className="text-sm">
              Lire toutes les règles
            </TextLink>
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

      {/* Litiges */}
      <section
        id="litiges"
        aria-labelledby="litiges-titre"
        className="scroll-mt-16 border-t"
      >
        <div
          className={`${section} grid gap-12 py-24 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:py-32`}
        >
          <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
            <h2
              id="litiges-titre"
              className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
            >
              Contester une triche
            </h2>
            <p className="max-w-md text-pretty text-muted-foreground">
              Un organisateur a fuité la solution ? Une épreuve refuse de
              valider certains joueurs ? Les joueurs tranchent d&apos;abord, un
              arbitre ensuite si le camp perdant fait appel.
            </p>
            <p className="max-w-md text-sm text-pretty text-muted-foreground">
              Deux niveaux, parce qu&apos;aucun camp n&apos;est neutre : un
              tiers sans intérêt dans la partie corrige le vote, et ses frais
              dissuadent d&apos;en abuser.
            </p>
          </div>
          <DisputeFlow />
        </div>
      </section>

      {/* Ce qui reste à faire confiance */}
      <section
        id="confiance"
        aria-labelledby="confiance-titre"
        className="scroll-mt-16 border-t bg-card/40"
      >
        <div
          className={`${section} grid gap-12 py-24 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:py-32`}
        >
          <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
            <h2
              id="confiance-titre"
              className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
            >
              Ce qui reste à faire confiance
            </h2>
            <p className="max-w-md text-pretty text-muted-foreground">
              Pwnpot n&apos;est pas « fully decentralised ». Il réduit la
              confiance au minimum, rend sa trahison coûteuse, et l&apos;écrit
              noir sur blanc.
            </p>
          </div>
          <TrustList />
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
              de le trouver. Pas de flag : chaque joueur a sa propre instance,
              et la factory vérifie son état avec{" "}
              <code className="font-mono text-sm">validateInstance</code>.
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
                  <p className="flex flex-col gap-1 text-xs text-muted-foreground">
                    Réussite vérifiée on-chain
                    <code className="font-mono [overflow-wrap:anywhere] text-secondary-foreground">
                      {challenge.check}
                    </code>
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

      {/* Appel final */}
      <section className="border-t">
        <div className={`${section} py-24 lg:py-32`}>
          <FinalCta />
        </div>
      </section>
    </>
  )
}

import {
  CoinsIcon,
  GavelIcon,
  LockKeyholeIcon,
  ShieldCheckIcon,
} from "lucide-react"
import Link from "next/link"

import { VulnTag } from "@/components/ctf/vuln-tag"
import { ExploitTrace } from "@/components/landing/exploit-trace"
import { PublishCtfButton } from "@/components/site/soon-button"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { formatEth, formatInt } from "@/lib/format"
import { kpis, type Vuln } from "@/lib/mock/explore"

const steps = [
  {
    title: "Publier",
    body: "L'organisateur déploie ses épreuves, dépose la cagnotte et une caution. Tout reste dans le contrat.",
  },
  {
    title: "Rejoindre",
    body: "Tu achètes un ticket avec ton wallet. Son prix vient grossir la cagnotte.",
  },
  {
    title: "Exploiter",
    body: "createInstance déploie une instance rien qu'à toi. Trouve la faille, écris ton attaque, vide-la.",
  },
  {
    title: "Encaisser",
    body: "validateInstance vérifie la réussite on-chain. À la clôture, ta part est créditée et tu la retires avec withdraw.",
  },
]

const guarantees = [
  {
    icon: LockKeyholeIcon,
    title: "Aucun administrateur",
    body: "Pas d'owner, pas de proxy, pas de pause. Personne ne peut sortir la cagnotte en dehors des règles du contrat.",
  },
  {
    icon: CoinsIcon,
    title: "Retrait à la demande",
    body: "Les gains sont crédités sur un solde interne. Tu les retires quand tu veux, aucun virement automatique ne peut échouer en route.",
  },
  {
    icon: GavelIcon,
    title: "Litiges arbitrés",
    body: "Un joueur qui soupçonne une triche ouvre un litige. Les joueurs votent, puis un appel est possible devant un arbitre ERC-792.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Code des organisateurs isolé",
    body: "Les épreuves sont vérifiées en staticcall avec une limite de gaz : une épreuve piégée ne peut ni modifier l'état ni bloquer la plateforme.",
  },
]

const challenges: { vuln: Vuln; title: string; goal: string; code: string }[] =
  [
    {
      vuln: "reentrancy",
      title: "Le coffre",
      goal: "Vide le coffre de tout son ETH.",
      code: `function withdraw() external {
  uint256 amount = balances[msg.sender];
  (bool ok, ) = msg.sender.call{value: amount}("");
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

const stats = [
  { value: formatEth(kpis.lockedPrizePools), label: "en cagnottes" },
  { value: formatInt(kpis.activePlayers), label: "joueurs cette semaine" },
  { value: formatInt(kpis.solved), label: "épreuves résolues" },
  { value: "0", label: "fonction admin dans le contrat" },
]

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 pt-16 pb-20 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:px-12 lg:pt-24 lg:pb-28">
        <div className="flex flex-col gap-7">
          <Badge variant="success" className="h-6 gap-1.5 px-2.5">
            <span aria-hidden className="size-1.5 rounded-full bg-success" />
            Testnet Base Sepolia
          </Badge>
          <h1 className="text-5xl font-semibold tracking-tighter text-balance sm:text-6xl lg:text-7xl">
            Casse le contrat. Empoche la cagnotte.
          </h1>
          <p className="max-w-xl text-lg text-pretty text-muted-foreground">
            Pwnpot héberge des CTF smart contracts payants. Chaque joueur
            exploite sa propre instance, la réussite est vérifiée on-chain, et
            le contrat garde la cagnotte jusqu&apos;au partage.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/explore" className={buttonVariants({ size: "lg" })}>
              Explorer les CTF
            </Link>
            <a
              href="#comment-ca-marche"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Comment ça marche
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            Un wallet suffit, pas de compte à créer.
          </p>
        </div>
        <ExploitTrace />
      </section>

      {/* Chiffres */}
      <section aria-label="Chiffres clés" className="border-y bg-card/50">
        <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-y-8 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-12">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1">
              <dt className="order-2 text-sm text-muted-foreground">
                {stat.label}
              </dt>
              <dd className="order-1 text-3xl font-semibold tracking-tight tabular-nums">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Comment ça marche */}
      <section
        id="comment-ca-marche"
        aria-labelledby="comment-ca-marche-titre"
        className="mx-auto flex max-w-7xl scroll-mt-20 flex-col gap-12 px-4 py-20 sm:px-6 lg:px-12 lg:py-28"
      >
        <div className="flex max-w-2xl flex-col gap-3">
          <h2
            id="comment-ca-marche-titre"
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Une partie en quatre transactions
          </h2>
          <p className="text-pretty text-muted-foreground">
            Pas de flag à recopier : c&apos;est l&apos;état de ton instance qui
            prouve que tu as réussi.
          </p>
        </div>
        <ol className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="flex flex-col gap-3 bg-background p-7"
            >
              <span className="font-mono text-sm text-primary-text tabular-nums">
                {index + 1}
              </span>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="text-sm text-pretty text-muted-foreground">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Garanties */}
      <section
        id="garanties"
        aria-labelledby="garanties-titre"
        className="border-t bg-card/50"
      >
        <div className="mx-auto grid max-w-7xl scroll-mt-20 gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.6fr] lg:px-12 lg:py-28">
          <div className="flex flex-col gap-3">
            <h2
              id="garanties-titre"
              className="text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              Le contrat fait l&apos;arbitre
            </h2>
            <p className="text-pretty text-muted-foreground">
              Cagnottes, tickets et cautions ne transitent par personne. Les
              règles sont dans le code, et le code est vérifié sur Basescan.
            </p>
          </div>
          <ul className="grid gap-x-10 gap-y-9 sm:grid-cols-2">
            {guarantees.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex flex-col gap-2.5">
                <Icon aria-hidden className="size-5 text-primary-text" />
                <h3 className="font-semibold">{title}</h3>
                <p className="text-sm text-pretty text-muted-foreground">
                  {body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Épreuves */}
      <section
        id="epreuves"
        aria-labelledby="epreuves-titre"
        className="mx-auto flex max-w-7xl scroll-mt-20 flex-col gap-12 px-4 py-20 sm:px-6 lg:px-12 lg:py-28"
      >
        <div className="flex max-w-2xl flex-col gap-3">
          <h2
            id="epreuves-titre"
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Trois failles pour commencer
          </h2>
          <p className="text-pretty text-muted-foreground">
            Les épreuves de lancement. Le bug est dans l&apos;extrait, à toi de
            le trouver.
          </p>
        </div>
        <ul className="grid gap-6 lg:grid-cols-3">
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
              <pre className="mt-auto overflow-x-auto border-t bg-muted/60 p-5 font-mono text-[0.75rem] leading-5 text-secondary-foreground">
                <code>{challenge.code}</code>
              </pre>
            </li>
          ))}
        </ul>
      </section>

      {/* Appel final */}
      <section className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-4 py-20 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-12">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-semibold tracking-tight">
              Ton premier contrat t&apos;attend
            </h2>
            <p className="text-muted-foreground">
              Ou publie ton propre CTF et fixe la cagnotte.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/explore" className={buttonVariants({ size: "lg" })}>
              Explorer les CTF
            </Link>
            <PublishCtfButton variant="outline" />
          </div>
        </div>
      </section>
    </>
  )
}

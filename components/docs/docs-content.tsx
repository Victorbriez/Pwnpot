// Contenu de la page Doc. Source : docs/DESIGN.md, docs/CHALLENGES.md et
// docs/SECURITY.md. Les montants des exemples sont calculés avec les mêmes
// fonctions que le reste du site, pour rester alignés sur les règles.
import { parseEther } from "viem"

import {
  Code,
  DocExample,
  DocList,
  DocSection,
  DocSubheading,
  DocText,
  Num,
} from "@/components/docs/doc-section"
import { DisputeFlow } from "@/components/landing/dispute-flow"
import { Settlement } from "@/components/landing/settlement"
import { VulnTag } from "@/components/ctf/vuln-tag"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  APPEAL_WINDOW,
  ARBITER_TIMEOUT,
  CONTESTATION_WINDOW,
  VOTE_WINDOW,
  contestBond,
  quorum,
} from "@/lib/ctf/dispute"
import { podiumShares } from "@/lib/ctf/gains"
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  MIN_TICKET_PRICE,
  minBond,
  totalValue,
} from "@/lib/ctf/params"
import { formatEth } from "@/lib/format"
import type { Vuln } from "@/lib/mock/explore"
import { StepList, type Step } from "@/components/site/step-list"
import { TextLink } from "@/components/site/text-link"

const hours = (seconds: number) => `${seconds / 3_600} h`
const days = (seconds: number) => `${seconds / 86_400} jours`

const worstCaseDays =
  (CONTESTATION_WINDOW + VOTE_WINDOW + APPEAL_WINDOW + ARBITER_TIMEOUT) / 86_400

// Exemple « Organiser » : celui de docs/DESIGN.md.
const orgExample = {
  cashPrize: parseEther("1"),
  ticketPrice: parseEther("0.01"),
  maxPlayers: 20,
}
const orgBond = minBond(
  orgExample.cashPrize,
  orgExample.ticketPrice,
  orgExample.maxPlayers
)
const orgSent = totalValue({
  cashPrize: orgExample.cashPrize,
  organizerBond: orgBond,
})

// Exemple « Jouer » : celui de la section « Où va l'argent » de l'accueil.
const playExample = {
  cashPrize: parseEther("0.4"),
  ticketPrice: parseEther("0.05"),
  sold: 16,
}
const playPot =
  playExample.cashPrize + playExample.ticketPrice * BigInt(playExample.sold)
const threeWinners = podiumShares(playPot, 3)
const twoWinners = podiumShares(playPot, 2)

// Exemple « Litiges » : 20 tickets, 14 voix « triche » contre 9.
const voteExample = { tickets: 20, cheat: 14, fair: 9 }
const voteQuorum = quorum(voteExample.tickets)
const voteTotal = voteExample.cheat + voteExample.fair
const cheatShare = Math.round((voteExample.cheat / voteTotal) * 100)

// Parcours d'un joueur, de l'achat du ticket au retrait.
const playSteps: Step[] = [
  {
    title: "Acheter un ticket",
    body: "Un seul par adresse, pendant que le CTF est ouvert ou en cours et tant qu'il reste des places.",
    call: "buyTicket(ctfId)",
  },
  {
    title: "Créer ton instance",
    body: "Pour chaque épreuve, la factory déploie ta copie personnelle du contrat vulnérable. Personne d'autre ne peut la casser à ta place.",
    call: "createInstance(ctfId, levelIndex)",
  },
  {
    title: "Exploiter",
    body: "Depuis ton wallet ou un contrat d'attaque, tu exploites la faille de ton instance.",
  },
  {
    title: "Soumettre",
    body: "La factory vérifie ton instance. Si c'est bon, tu marques 1 point, horodaté au bloc.",
    call: "submit(ctfId, levelIndex)",
  },
  {
    title: "Retirer",
    body: "À la fin, ce qui t'est dû est crédité sur ton solde. Tu le retires depuis Mes gains.",
    call: "withdraw()",
  },
]

const lifecycle = [
  {
    phase: "Ouvert",
    can: "Acheter un ticket.",
    exit: "Le temps : heure de début.",
  },
  {
    phase: "En cours",
    can: "Acheter un ticket (jusqu'au nombre de places), créer ses instances, soumettre ses réussites.",
    exit: "Le temps : heure de fin.",
  },
  {
    phase: "Contestation",
    can: `Ouvrir un litige, pendant ${hours(CONTESTATION_WINDOW)}.`,
    exit: "Le temps. Sans litige, les gains sont retirables à la fin de la fenêtre.",
  },
  {
    phase: "Vote",
    can: `Voter, pendant ${hours(VOTE_WINDOW)} (détenteurs de ticket, 1 adresse = 1 voix).`,
    exit: "Le temps.",
  },
  {
    phase: "Fenêtre d'appel",
    can: `Faire appel à l'arbitre, pendant ${hours(APPEAL_WINDOW)}.`,
    exit: "Le temps.",
  },
  {
    phase: "En appel",
    can: "L'arbitre rend sa décision.",
    exit: `L'arbitre, ou le délai de ${days(ARBITER_TIMEOUT)} : sans réponse, le vote s'applique.`,
  },
  {
    phase: "Finalisé / Triche confirmée",
    can: "Retirer ce qui est dû.",
    exit: "—",
  },
]

const outcomes = [
  {
    outcome: "Fin normale, au moins une réussite",
    winners: "Cash prize + tickets, répartis sur le podium",
    players: "—",
    organizer: "Récupère sa caution",
    contester: "—",
  },
  {
    outcome: "Personne n'a réussi",
    winners: "—",
    players: "Ticket remboursé",
    organizer: "Récupère cash prize + caution",
    contester: "—",
  },
  {
    outcome: "Litige rejeté",
    winners: "Comme une fin normale",
    players: "—",
    organizer: "Sa caution + la caution du contestataire",
    contester: "Perd sa caution",
  },
  {
    outcome: "Triche confirmée",
    winners: "—",
    players: "Ticket remboursé",
    organizer: "Perd sa caution (brûlée), récupère son cash prize",
    contester: "Caution rendue",
  },
]

const challenges: {
  name: string
  vuln: Vuln
  how: string
  win: string
  lesson: string
}[] = [
  {
    name: "Coffre",
    vuln: "reentrancy",
    how: "withdraw envoie l'ETH avant de remettre le solde à zéro.",
    win: "Le coffre de ton instance est vide (alors qu'il avait un solde au départ).",
    lesson: "Checks-Effects-Interactions.",
  },
  {
    name: "Usurpateur",
    vuln: "tx-origin",
    how: "Le contrat authentifie le propriétaire avec tx.origin au lieu de msg.sender.",
    win: "Tu es devenu owner de ton instance.",
    lesson: "On authentifie toujours avec msg.sender.",
  },
  {
    name: "Coffre-fort à code",
    vuln: "storage",
    how: "Le mot de passe est en private, mais tout le storage reste lisible.",
    win: "Ton instance est déverrouillée.",
    lesson: "Il n'y a pas de secret sur une chaîne.",
  },
]

const parameters = [
  { name: "Cash prize", by: "Organisateur", value: "Libre, supérieur à 0" },
  {
    name: "Prix du ticket",
    by: "Organisateur",
    value: `Au moins ${formatEth(MIN_TICKET_PRICE)}`,
  },
  {
    name: "Nombre de places",
    by: "Organisateur",
    value: `${MIN_PLAYERS} à ${MAX_PLAYERS}`,
  },
  {
    name: "Caution de l'organisateur",
    by: "Organisateur",
    value: "Au moins cash prize + places × prix du ticket",
  },
  { name: "Durée du CTF", by: "Organisateur", value: "1 h à 30 jours" },
  { name: "Tickets par adresse", by: "Contrat", value: "1" },
  {
    name: "Fenêtre de contestation",
    by: "Déploiement",
    value: hours(CONTESTATION_WINDOW),
  },
  { name: "Durée du vote", by: "Déploiement", value: hours(VOTE_WINDOW) },
  { name: "Fenêtre d'appel", by: "Déploiement", value: hours(APPEAL_WINDOW) },
  {
    name: "Délai de l'arbitre",
    by: "Déploiement",
    value: days(ARBITER_TIMEOUT),
  },
  { name: "Quorum", by: "Contrat", value: "max(3 votants, 20 % des tickets)" },
  {
    name: "Caution de contestation",
    by: "Par CTF",
    value: `max(3 × prix du ticket, ${formatEth(contestBond(BigInt(0)))})`,
  },
  {
    name: "Gaz de la validation",
    by: "Contrat",
    value: "300 000 (proposé)",
  },
  { name: "Arbitre", by: "Déploiement", value: "Fixé à vie (ERC-792)" },
]

const faq = [
  {
    q: "L'organisateur peut-il partir avec la cagnotte ?",
    a: "Non. Le cash prize, les tickets et sa caution sont détenus par le contrat, qui n'a ni owner, ni proxy, ni pause. L'argent ne sort que selon les quatre issues décrites plus haut.",
  },
  {
    q: "Et si personne ne réussit ?",
    a: "Chaque joueur récupère son ticket et l'organisateur récupère son cash prize et sa caution. Publier une épreuve impossible ne rapporte donc rien.",
  },
  {
    q: "Pourquoi il n'y a pas de flag à trouver ?",
    a: "Un flag stocké on-chain serait lisible par tout le monde. La réussite est vérifiée par la factory, qui lit l'état de ton instance (coffre vide, owner changé…).",
  },
  {
    q: "Quelqu'un peut-il recopier mon exploit ?",
    a: "Oui, tout ce qui passe sur la chaîne est public. Mais il le jouera après toi, et le classement départage au temps : il finira derrière.",
  },
  {
    q: "Pourquoi un seul ticket par adresse ?",
    a: "Parce que le vote d'un litige compte une voix par adresse. Avec plusieurs tickets ou des tickets gratuits, un organisateur pourrait acheter le vote.",
  },
  {
    q: "Le gas est-il remboursé ?",
    a: "Non, dans aucun cas, même si la triche est confirmée.",
  },
  {
    q: "Qui déclenche la fin du CTF ?",
    a: "N'importe qui. Toutes les étapes liées au temps sont ouvertes à tous : si l'organisateur disparaît, le CTF se termine quand même.",
  },
  {
    q: "Comment je récupère mes gains ?",
    a: "Le contrat crédite ton solde, puis tu le retires en une transaction depuis Mes gains. Personne ne t'envoie l'argent automatiquement.",
  },
]

function DataTable({
  head,
  rows,
}: {
  head: string[]
  rows: React.ReactNode[][]
}) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            {head.map((h) => (
              <TableHead key={h}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              {row.map((cell, j) => (
                <TableCell
                  key={j}
                  className={
                    j === 0
                      ? "align-top font-medium whitespace-normal"
                      : "align-top whitespace-normal text-muted-foreground"
                  }
                >
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function DocsContent() {
  return (
    <>
      <DocSection
        id="principe"
        title="Le principe"
        lead="Pwnpot est une plateforme ouverte de CTF smart contracts payants. N'importe qui publie un CTF ; la cagnotte, les tickets et les cautions sont gérés uniquement par le contrat."
      >
        <DocText>
          Chaque épreuve est un contrat volontairement vulnérable. Tu en reçois
          ta propre copie (ton <em>instance</em>), tu l&apos;exploites, puis le
          contrat vérifie lui-même que c&apos;est fait. Il n&apos;y a pas de
          flag : la réussite se lit dans l&apos;état de la chaîne.
        </DocText>
        <DataTable
          head={["Acteur", "Rôle"]}
          rows={[
            [
              "Organisateur",
              "Publie un CTF, fournit les épreuves, dépose le cash prize et une caution.",
            ],
            [
              "Joueur",
              "Achète un ticket (un seul par adresse), exploite ses instances, soumet ses réussites, peut contester et voter.",
            ],
            [
              "Arbitre",
              "Contrat ERC-792 fixé au déploiement. Il ne tranche que les litiges portés en appel.",
            ],
            [
              "N'importe qui",
              "Peut déclencher les étapes liées au temps (fin du CTF, finalisation, délai de l'arbitre).",
            ],
          ]}
        />
        <DocText>
          La plateforme n&apos;a <strong>pas d&apos;owner</strong>, pas de
          proxy, pas de pause et aucune fonction d&apos;administration.
          Personne, pas même l&apos;équipe Pwnpot, ne peut changer les règles ou
          geler les fonds.
        </DocText>
      </DocSection>

      <DocSection
        id="jouer"
        title="Jouer"
        lead="De l'achat du ticket au retrait des gains, en cinq étapes."
      >
        <StepList steps={playSteps} />

        <DocSubheading>Classement</DocSubheading>
        <DocList>
          <li>Chaque épreuve réussie rapporte 1 point.</li>
          <li>
            À score égal, celui dont la <strong>dernière</strong> réussite est
            la plus ancienne passe devant.
          </li>
          <li>
            Dans le même bloc, le premier enregistré garde sa place : il faut
            être strictement meilleur pour doubler.
          </li>
          <li>
            Le podium se partage <Num>cash prize + tickets</Num> :{" "}
            <Num>60 / 30 / 10 %</Num>. Avec 2 gagnants : <Num>67 / 33 %</Num>.
            Avec 1 gagnant, il prend tout.
          </li>
        </DocList>

        <DocExample title="répartition du podium">
          <p>
            Cash prize de <Num>{formatEth(playExample.cashPrize)}</Num>,{" "}
            {playExample.sold} tickets vendus à{" "}
            <Num>{formatEth(playExample.ticketPrice)}</Num>. La cagnotte vaut{" "}
            <Num>{formatEth(playPot)}</Num>.
          </p>
          <DataTable
            head={["Gagnants", "1er", "2e", "3e"]}
            rows={[
              ["3 ou plus", ...threeWinners.map((v) => formatEth(v))],
              ["2", ...twoWinners.map((v) => formatEth(v)), "—"],
              ["1", formatEth(playPot), "—", "—"],
            ]}
          />
          <p>
            Les parts du 2e et du 3e sont calculées d&apos;abord ; le reste,
            arrondis compris, va au 1er. Aucun wei ne reste bloqué.
          </p>
        </DocExample>
      </DocSection>

      <DocSection
        id="organiser"
        title="Organiser"
        lead="Tu choisis les épreuves, la cagnotte, le prix du ticket et les dates. En échange, tu bloques une caution dans le contrat."
      >
        <DocList>
          <li>
            <strong>Cash prize</strong> : ce que tu offres en plus des tickets.
          </li>
          <li>
            <strong>Ticket</strong> : au moins{" "}
            <Num>{formatEth(MIN_TICKET_PRICE)}</Num>, pour que chaque voix
            d&apos;un litige ait un coût.
          </li>
          <li>
            <strong>Places</strong> : de {MIN_PLAYERS} à {MAX_PLAYERS} joueurs.
          </li>
          <li>
            <strong>Durée</strong> : de 1 h à 30 jours.
          </li>
          <li>
            <strong>Caution</strong> : au moins{" "}
            <Num>cash prize + places × ticket</Num>. C&apos;est ce qu&apos;un
            organisateur tricheur pourrait récupérer au mieux via un complice :
            la caution doit au moins le couvrir.
          </li>
        </DocList>

        <DocExample title="caution et montant envoyé">
          <p>
            Cash prize de <Num>{formatEth(orgExample.cashPrize)}</Num>,{" "}
            {orgExample.maxPlayers} places, ticket à{" "}
            <Num>{formatEth(orgExample.ticketPrice)}</Num>.
          </p>
          <DocList>
            <li>
              Caution minimale : {formatEth(orgExample.cashPrize)} +{" "}
              {orgExample.maxPlayers} × {formatEth(orgExample.ticketPrice)} ={" "}
              <Num>{formatEth(orgBond)}</Num>.
            </li>
            <li>
              Montant envoyé avec <Code>createCTF</Code> : cash prize + caution
              = <Num>{formatEth(orgSent)}</Num>.
            </li>
            <li>
              Caution qu&apos;un joueur devra déposer pour contester :{" "}
              <Num>{formatEth(contestBond(orgExample.ticketPrice))}</Num>.
            </li>
          </DocList>
        </DocExample>

        <DocSubheading>Les épreuves que tu fournis</DocSubheading>
        <DocText>
          Chaque épreuve est une <strong>factory</strong> : un contrat qui
          déploie une instance par joueur (<Code>createInstance</Code>) et dit
          si elle a été exploitée (<Code>validateInstance</Code>, en lecture
          seule). Les factories sont libres : c&apos;est la seule option
          compatible avec une plateforme sans owner. Le site affiche si leur
          code est vérifié sur Basescan.
        </DocText>
        <DocText>
          Pour le Coffre, c&apos;est ta factory qui alimente les instances (
          <Num>places × {formatEth(MIN_TICKET_PRICE)}</Num>). Ce qu&apos;un
          joueur vide, il le garde ; tu récupères le reste après le CTF.
        </DocText>
        <DocText>
          Prêt ? <TextLink href="/organize/new">Créer un CTF</TextLink>.
        </DocText>
      </DocSection>

      <DocSection
        id="cycle-de-vie"
        title="Cycle de vie d'un CTF"
        lead={`Sans litige, tout est réglé ${hours(CONTESTATION_WINDOW)} après la fin. Dans le pire cas (contestation, vote, appel, délai de l'arbitre), ${worstCaseDays} jours.`}
      >
        <DataTable
          head={["Phase", "Ce qui est possible", "Ce qui la termine"]}
          rows={lifecycle.map((row) => [row.phase, row.can, row.exit])}
        />
        <DocText>
          Toutes les étapes liées au temps peuvent être déclenchées par
          n&apos;importe qui (<Code>finalize</Code>,{" "}
          <Code>applyVoteAfterTimeout</Code>). Si l&apos;organisateur disparaît,
          le CTF se termine quand même.
        </DocText>
      </DocSection>

      <DocSection
        id="argent"
        title="Où va l'argent"
        lead="Cash prize, tickets et cautions sont déposés dans le contrat dès le départ. À la clôture, il n'y a que quatre issues possibles."
      >
        <Settlement />
        <DataTable
          head={[
            "Issue",
            "Gagnants",
            "Joueurs",
            "Organisateur",
            "Contestataire",
          ]}
          rows={outcomes.map((row) => [
            row.outcome,
            row.winners,
            row.players,
            row.organizer,
            row.contester,
          ])}
        />
        <DocSubheading>Personne ne reçoit de virement</DocSubheading>
        <DocText>
          Chaque issue crédite un solde interne. Chacun appelle ensuite{" "}
          <Code>withdraw</Code> pour retirer ce qui lui est dû (
          <em>pull payment</em>). Un retrait qui échoue ne bloque que celui-là,
          jamais les autres.
        </DocText>
        <DocSubheading>Pourquoi la caution est brûlée</DocSubheading>
        <DocText>
          Si elle était partagée entre les votants, voter « triche » deviendrait
          rentable pour tous les perdants. Brûlée, elle punit
          l&apos;organisateur sans pousser à mal voter. Son cash prize lui est
          rendu : la caution suffit comme punition, et la perte reste limitée si
          l&apos;arbitre se trompe.
        </DocText>
        <DocText>Le gas n&apos;est jamais remboursé.</DocText>
      </DocSection>

      <DocSection
        id="litiges"
        title="Litiges et appel"
        lead="Si un joueur soupçonne une triche (épreuve truquée, solution fuitée), il peut contester après la fin du CTF."
      >
        <DisputeFlow />
        <DocList>
          <li>
            <strong>Ouverture</strong> : pendant {hours(CONTESTATION_WINDOW)},
            un détenteur de ticket dépose la caution de contestation,{" "}
            <Num>max(3 × ticket, {formatEth(contestBond(BigInt(0)))})</Num>. Un
            seul litige par CTF.
          </li>
          <li>
            <strong>Vote</strong> ({hours(VOTE_WINDOW)}) : chaque détenteur de
            ticket vote « triche » ou « pas de triche ». La triche est retenue
            avec plus de 50 % des voix <strong>et</strong> le quorum,{" "}
            <Num>max(3 votants, 20 % des tickets)</Num>. Quorum raté = « pas de
            triche ».
          </li>
          <li>
            <strong>Appel</strong> ({hours(APPEAL_WINDOW)}) : le camp perdant
            peut porter l&apos;affaire devant l&apos;arbitre en avançant ses
            frais. Ils lui sont remboursés s&apos;il gagne, pris sur la caution
            du camp adverse (dans la limite de cette caution).
          </li>
          <li>
            <strong>Décision</strong> : celle de l&apos;arbitre est définitive.
            Sans réponse sous {days(ARBITER_TIMEOUT)}, le résultat du vote
            s&apos;applique.
          </li>
        </DocList>

        <DocExample title="un vote">
          <p>
            {voteExample.tickets} tickets vendus : le quorum est de{" "}
            <Num>{voteQuorum} votants</Num>. {voteExample.cheat} joueurs votent
            « triche », {voteExample.fair} « pas de triche ».
          </p>
          <p>
            {voteTotal} votants, quorum atteint, <Num>{cheatShare} %</Num> pour
            « triche » : la triche est retenue. Si l&apos;organisateur ne fait
            pas appel dans les {hours(APPEAL_WINDOW)}, sa caution est brûlée et
            chaque joueur récupère son ticket.
          </p>
        </DocExample>

        <DocText>
          Pourquoi deux niveaux ? Les perdants ont intérêt à voter « triche »,
          et un organisateur tricheur peut inscrire des complices. Un arbitre
          sans intérêt dans la partie corrige ces deux biais, et son coût
          dissuade d&apos;en abuser.{" "}
          <TextLink href="/disputes">Voir les litiges en cours</TextLink>.
        </DocText>
      </DocSection>

      <DocSection
        id="epreuves"
        title="Les épreuves"
        lead="Trois épreuves classiques de sécurité Solidity, une instance par joueur, sur le principe d'Ethernaut."
      >
        <div className="grid gap-4">
          {challenges.map((c, i) => (
            <Card key={c.name}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-muted-foreground tabular-nums">
                    {i + 1}.
                  </span>
                  {c.name}
                  <VulnTag vuln={c.vuln} />
                </CardTitle>
                <CardDescription>{c.how}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-1.5 text-sm">
                <p>
                  <span className="font-medium">Réussite :</span>{" "}
                  <span className="text-muted-foreground">{c.win}</span>
                </p>
                <p>
                  <span className="font-medium">Ce que ça enseigne :</span>{" "}
                  <span className="text-muted-foreground">{c.lesson}</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <DocSubheading>À vérifier avant de payer un ticket</DocSubheading>
        <DocText>
          Les factories sont écrites par les organisateurs : elles ne sont pas
          fiables par défaut. Vérifie que :
        </DocText>
        <DocList>
          <li>le code de chaque factory est vérifié sur Basescan ;</li>
          <li>
            <Code>validateInstance</Code> lit seulement l&apos;état de
            l&apos;instance, sans exception pour une adresse ni porte dérobée ;
          </li>
          <li>
            la factory n&apos;est pas un proxy (pas de <Code>delegatecall</Code>{" "}
            vers un code remplaçable) ;
          </li>
          <li>
            le <Code>codehash</Code> enregistré à la création du CTF correspond
            au code lu.
          </li>
        </DocList>
      </DocSection>

      <DocSection
        id="securite"
        title="Sécurité et limites"
        lead="Ce que le contrat garantit, et ce qu'il ne peut pas empêcher."
      >
        <DocSubheading>Garanti par le contrat</DocSubheading>
        <DocList>
          <li>
            Les fonds ne sortent que selon les règles : aucune fonction admin.
          </li>
          <li>
            Personne ne peut soumettre à ta place : <Code>submit</Code> ne
            valide que l&apos;instance de l&apos;appelant.
          </li>
          <li>
            Une factory malveillante ne bloque au pire que son épreuve, jamais
            les fonds (appel en lecture seule avec limite de gaz).
          </li>
          <li>
            Pas de boucle sur les joueurs : le nombre de joueurs ne bloque rien.
          </li>
        </DocList>
        <DocSubheading>Limites assumées</DocSubheading>
        <DocList>
          <li>
            <strong>Fuite de solution</strong> : un organisateur qui donne la
            solution à un complice ne laisse aucune trace. C&apos;est coûteux
            (caution) et contestable (litige), pas impossible.
          </li>
          <li>
            <strong>Exploit copiable</strong> : une fois sur la chaîne, il est
            public. Le copieur arrive après, mais peut encore finir 2e ou 3e.
          </li>
          <li>
            <strong>Vote biaisé</strong> : les perdants ont intérêt à voter «
            triche ». L&apos;appel corrige ce biais.
          </li>
          <li>
            <strong>Arbitre</strong> : il est de confiance en appel. Sur ce
            testnet, c&apos;est un arbitre de démonstration contrôlé par
            l&apos;équipe.
          </li>
        </DocList>
      </DocSection>

      <DocSection
        id="parametres"
        title="Paramètres"
        lead="Les valeurs fixées par l'organisateur, par le contrat et au déploiement."
      >
        <DataTable
          head={["Paramètre", "Fixé par", "Valeur"]}
          rows={parameters.map((p) => [p.name, p.by, p.value])}
        />
      </DocSection>

      <DocSection id="faq" title="Questions fréquentes">
        <dl className="flex flex-col gap-6">
          {faq.map((item) => (
            <div key={item.q} className="flex flex-col gap-1.5">
              <dt className="font-medium">{item.q}</dt>
              <dd className="leading-7 text-muted-foreground">{item.a}</dd>
            </div>
          ))}
        </dl>
      </DocSection>
    </>
  )
}

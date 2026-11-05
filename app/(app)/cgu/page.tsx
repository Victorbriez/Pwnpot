import type { Metadata } from "next"

import {
  ExternalLink,
  InternalLink,
  LegalDoc,
  LegalSection,
} from "@/components/legal/legal-doc"
import { site } from "@/lib/site"

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation",
  description:
    "Règles d'utilisation de Pwnpot : CTF smart contracts sur Base Sepolia, rôle du contrat, obligations des organisateurs et des joueurs, litiges et limites.",
}

const sections = [
  { id: "objet", label: "Objet" },
  { id: "service", label: "Le service" },
  { id: "contrat", label: "Le contrat fait foi" },
  { id: "organisateurs", label: "Organisateurs" },
  { id: "joueurs", label: "Joueurs" },
  { id: "litiges", label: "Litiges et arbitrage" },
  { id: "garanties", label: "Absence de valeur et de garantie" },
  { id: "responsabilite", label: "Responsabilité" },
  { id: "interface", label: "Contenus et interface" },
  { id: "droit", label: "Modification et droit applicable" },
]

export default function CguPage() {
  return (
    <LegalDoc
      title="Conditions générales d'utilisation"
      sections={sections}
      intro={
        <>
          Ces conditions encadrent l&apos;utilisation du site Pwnpot. Les
          informations sur l&apos;éditeur et les données personnelles sont dans
          les{" "}
          <InternalLink href="/mentions-legales">mentions légales</InternalLink>
          . Mise à jour : {site.legalUpdatedAt}.
        </>
      }
    >
      <LegalSection id="objet" title="Objet">
        <p>
          Pwnpot est une interface web, gratuite, qui permet de publier et de
          jouer à des CTF smart contracts sur le réseau de test Base Sepolia.
          C&apos;est un projet étudiant réalisé dans le cadre du module{" "}
          {site.editor.module} à {site.editor.school}.
        </p>
        <p>
          Utiliser le site, ou signer une transaction préparée par lui, vaut
          acceptation de ces conditions.
        </p>
      </LegalSection>

      <LegalSection id="service" title="Le service">
        <ul>
          <li>
            Un <strong>organisateur</strong> publie un CTF composé
            d&apos;épreuves. Il dépose un cash prize et une caution, et fixe le
            prix du ticket, le nombre de places et les dates.
          </li>
          <li>
            Un <strong>joueur</strong> achète un ticket, obtient sa propre
            instance de chaque épreuve, l&apos;exploite, puis soumet sa
            réussite. La réussite est vérifiée on-chain par la factory de
            l&apos;épreuve.
          </li>
          <li>
            À la clôture, les fonds sont crédités selon l&apos;issue du CTF, et
            chacun retire lui-même ce qui lui est dû.
          </li>
        </ul>
        <p>
          L&apos;accès au site est libre. Il faut un wallet compatible et de
          l&apos;ETH de test, obtenu gratuitement sur un{" "}
          <ExternalLink href={site.links.faucet}>faucet</ExternalLink>. Le site
          peut être interrompu à tout moment, sans préavis : les contrats
          restent utilisables directement depuis{" "}
          <ExternalLink href={site.links.explorer}>Basescan</ExternalLink>.
        </p>
      </LegalSection>

      <LegalSection id="contrat" title="Le contrat fait foi">
        <p>
          Les fonds (cash prize, tickets, cautions) sont détenus par le contrat
          CTFPlatform, jamais par l&apos;éditeur. Ce contrat n&apos;a ni
          propriétaire, ni fonction d&apos;administration, ni mécanisme de pause
          ou de mise à jour.
        </p>
        <p>
          <strong>
            En cas de différence entre ce que dit le site et ce que fait le
            contrat, c&apos;est le code du contrat qui s&apos;applique.
          </strong>{" "}
          Les textes et exemples du site, notamment la répartition des gains,
          les durées et les seuils, sont donnés à titre indicatif.
          L&apos;éditeur ne peut ni annuler une transaction, ni rembourser, ni
          modifier une issue.
        </p>
      </LegalSection>

      <LegalSection id="organisateurs" title="Organisateurs">
        <p>En publiant un CTF, l&apos;organisateur s&apos;engage à :</p>
        <ul>
          <li>
            publier des épreuves qui peuvent être résolues, dont la validation
            ne lit que l&apos;état de l&apos;instance du joueur, sans exception
            par adresse ni porte dérobée ;
          </li>
          <li>
            publier et vérifier le code de ses factories sur Basescan, sans
            proxy ni code remplaçable ;
          </li>
          <li>
            ne communiquer aucune solution, ni aucun indice réservé, à un joueur
            avant ou pendant le CTF ;
          </li>
          <li>
            ne publier aucun contrat malveillant envers les joueurs, par exemple
            un contrat qui cherche à vider leur wallet.
          </li>
        </ul>
        <p>
          Une triche reconnue par un litige entraîne la perte de sa caution,
          selon les règles du contrat.
        </p>
      </LegalSection>

      <LegalSection id="joueurs" title="Joueurs">
        <p>
          <strong>
            L&apos;exploitation est autorisée uniquement sur les instances des
            épreuves.
          </strong>{" "}
          Chaque joueur exploite sa propre instance, depuis son wallet ou avec
          son propre contrat d&apos;attaque.
        </p>
        <p>Il est interdit :</p>
        <ul>
          <li>
            d&apos;attaquer le site, son hébergement, le contrat CTFPlatform
            hors des règles du jeu, ou les wallets d&apos;autres utilisateurs ;
          </li>
          <li>
            de perturber le service, par exemple par une saturation volontaire
            du site ou du nœud RPC ;
          </li>
          <li>
            de s&apos;entendre avec un organisateur pour obtenir une solution.
          </li>
        </ul>
        <p>
          Une faille découverte dans CTFPlatform ou dans le site, en dehors des
          épreuves, ne doit pas être exploitée : signale-la à l&apos;équipe du
          projet. Les actes de piratage en dehors des épreuves restent soumis à
          la loi, notamment aux articles 323-1 et suivants du Code pénal.
        </p>
        <p>
          Copier un exploit vu sur la chaîne est possible : tout ce qui est
          on-chain est public. Le classement départage les joueurs selon
          l&apos;heure de leur dernière réussite.
        </p>
      </LegalSection>

      <LegalSection id="litiges" title="Litiges et arbitrage">
        <p>
          Un joueur qui soupçonne une triche de l&apos;organisateur peut ouvrir
          un litige, pendant la fenêtre de contestation, en déposant une
          caution. Les détenteurs de tickets votent, puis le camp perdant peut
          faire appel à un arbitre au standard{" "}
          <ExternalLink href={site.links.erc792}>ERC-792</ExternalLink>. Le
          détail est sur la{" "}
          <InternalLink href="/#litiges">page d&apos;accueil</InternalLink>.
        </p>
        <p>
          <strong>Arbitre de démonstration.</strong> Pour ce projet,
          l&apos;arbitre est un contrat de test (MockArbitrator) contrôlé par
          l&apos;équipe du projet : ses décisions ne sont pas indépendantes. Sa
          décision, une fois inscrite sur la chaîne, est définitive et ne porte
          que sur les fonds du litige.
        </p>
      </LegalSection>

      <LegalSection id="garanties" title="Absence de valeur et de garantie">
        <ul>
          <li>
            L&apos;ETH de Base Sepolia <strong>n&apos;a aucune valeur</strong>.
            Pwnpot n&apos;est ni un jeu d&apos;argent, ni un service financier,
            et ne doit jamais être utilisé avec des fonds réels.
          </li>
          <li>
            Le site et les contrats sont fournis <strong>en l&apos;état</strong>
            , sans garantie de disponibilité ni d&apos;absence de bug. Ils
            n&apos;ont pas fait l&apos;objet d&apos;un audit de sécurité.
          </li>
          <li>
            Le réseau de test peut être réinitialisé, ralenti ou abandonné par
            ses opérateurs.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="responsabilite" title="Responsabilité">
        <ul>
          <li>
            L&apos;éditeur n&apos;a aucun pouvoir sur les fonds et ne répond pas
            des CTF publiés par des tiers, ni du contenu de leurs épreuves.
          </li>
          <li>
            Chaque utilisateur est seul responsable de son wallet, de ses clés
            et des transactions qu&apos;il signe. Utilise un wallet dédié au
            testnet, qui ne détient aucun fonds réel.
          </li>
          <li>
            Avant d&apos;acheter un ticket, c&apos;est au joueur de lire le code
            vérifié des épreuves.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="interface" title="Contenus et interface">
        <p>
          Les titres, descriptions et épreuves d&apos;un CTF sont publiés par
          son organisateur. L&apos;éditeur peut retirer de l&apos;interface un
          CTF manifestement illicite ou malveillant. Ce retrait ne touche pas au
          contrat : le CTF et ses fonds restent accessibles on-chain, selon les
          mêmes règles.
        </p>
      </LegalSection>

      <LegalSection id="droit" title="Modification et droit applicable">
        <p>
          Ces conditions peuvent évoluer avec le projet. La version applicable
          est celle publiée sur cette page, à la date indiquée en haut.
        </p>
        <p>Elles sont soumises au droit français.</p>
      </LegalSection>
    </LegalDoc>
  )
}

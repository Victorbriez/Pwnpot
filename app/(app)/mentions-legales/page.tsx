import type { Metadata } from "next"

import {
  ExternalLink,
  InternalLink,
  LegalDoc,
  LegalSection,
} from "@/components/legal/legal-doc"
import { site } from "@/lib/site"

export const metadata: Metadata = {
  title: "Mentions légales",
  description:
    "Éditeur, hébergement, données personnelles, stockage local et avertissement de Pwnpot, projet étudiant sur Base Sepolia.",
}

const sections = [
  { id: "editeur", label: "Éditeur" },
  { id: "hebergement", label: "Hébergement" },
  { id: "confidentialite", label: "Données personnelles" },
  { id: "stockage", label: "Stockage local et cookies" },
  { id: "avertissement", label: "Avertissement" },
  { id: "propriete", label: "Propriété intellectuelle" },
]

export default function LegalPage() {
  const { editor, host, rpc } = site

  return (
    <LegalDoc
      title="Mentions légales"
      sections={sections}
      intro={
        <p>
          Pwnpot est un projet étudiant, déployé uniquement sur le réseau de
          test Base Sepolia. L&apos;utilisation du site est encadrée par les{" "}
          <InternalLink href="/cgu">
            conditions générales d&apos;utilisation
          </InternalLink>
          . Mise à jour : {site.legalUpdatedAt}.
        </p>
      }
    >
      <LegalSection id="editeur" title="Éditeur">
        <p>
          Ce site est édité à titre non professionnel par{" "}
          <strong>{editor.name}</strong>, dans le cadre du module{" "}
          <strong>{editor.module}</strong> à {editor.school}.
        </p>
        <p>
          Directeur de la publication :{" "}
          <strong>{editor.publicationDirector}</strong>.
        </p>
        {editor.contact ? (
          <p>
            Contact :{" "}
            <a
              href={`mailto:${editor.contact}`}
              className="font-medium text-foreground underline underline-offset-4"
            >
              {editor.contact}
            </a>
          </p>
        ) : (
          <p>
            Conformément à l&apos;article 6-III-2 de la loi n° 2004-575 du 21
            juin 2004 (LCEN), l&apos;éditeur, non professionnel, a communiqué
            ses coordonnées à l&apos;hébergeur, qui peut le joindre si
            nécessaire.
          </p>
        )}
      </LegalSection>

      <LegalSection id="hebergement" title="Hébergement">
        <p>
          Le site est hébergé par <strong>{host.name}</strong>, {host.address} (
          <ExternalLink href={host.url}>
            {host.url.replace("https://", "")}
          </ExternalLink>
          ).
        </p>
        <p>
          Les cagnottes, tickets et cautions ne sont pas hébergés par le site :
          ils sont détenus par le contrat CTFPlatform, déployé sur la blockchain
          Base Sepolia.
        </p>
      </LegalSection>

      <LegalSection id="confidentialite" title="Données personnelles">
        <p>
          <strong>Pwnpot ne collecte aucune donnée personnelle.</strong> Il
          n&apos;y a ni compte, ni formulaire, ni base de données, ni outil de
          mesure d&apos;audience, ni publicité. Le site ne fait que lire la
          blockchain et préparer des transactions que tu signes dans ton wallet.
        </p>

        <h3>Responsable du traitement</h3>
        <p>
          {editor.name}, éditeur du site, pour les seules données techniques
          décrites ci-dessous.
        </p>

        <h3>Ce qui est traité, et par qui</h3>
        <ul>
          <li>
            <strong>Journaux de connexion</strong> (adresse IP, date, page
            demandée, navigateur) : conservés par l&apos;hébergeur {host.name}{" "}
            pour faire fonctionner et sécuriser le site, selon sa{" "}
            <ExternalLink href={host.privacyUrl}>
              politique de confidentialité
            </ExternalLink>
            . L&apos;éditeur n&apos;exploite pas ces journaux.
          </li>
          <li>
            <strong>Lecture de la blockchain</strong> : ton navigateur interroge
            directement un nœud Base Sepolia (par défaut{" "}
            <code className="font-mono text-sm">
              {rpc.url.replace("https://", "")}
            </code>
            , fourni par {rpc.name}). Ce nœud voit ton adresse IP et les
            adresses consultées (voir sa{" "}
            <ExternalLink href={rpc.privacyUrl}>
              politique de confidentialité
            </ExternalLink>
            ).
          </li>
          <li>
            <strong>Adresse de wallet</strong> : lue dans ton navigateur, elle
            n&apos;est envoyée à aucun serveur de Pwnpot. Si tu te connectes
            avec Base Account, ce service est fourni par Coinbase.
          </li>
          <li>
            <strong>Transactions</strong> : chaque transaction que tu signes
            (ticket, instance, soumission, vote, retrait) est inscrite sur la
            blockchain avec ton adresse. Elle est publique, et ni l&apos;éditeur
            ni personne ne peut l&apos;effacer.
          </li>
        </ul>

        <h3>Base légale et durée</h3>
        <p>
          Ces traitements techniques reposent sur l&apos;intérêt légitime à
          faire fonctionner le site (article 6.1.f du RGPD). Leur durée de
          conservation est celle fixée par l&apos;hébergeur et le fournisseur du
          nœud. Les données inscrites sur la blockchain sont conservées sans
          limite de durée, par nature.
        </p>

        <h3>Transfert hors de l&apos;Union européenne</h3>
        <p>
          {host.name} et Coinbase sont des sociétés américaines : les journaux
          techniques peuvent être traités aux États-Unis, dans le cadre de
          l&apos;EU-US Data Privacy Framework ou de clauses contractuelles
          types, comme décrit dans leurs politiques de confidentialité.
        </p>

        <h3>Tes droits</h3>
        <p>
          Tu disposes d&apos;un droit d&apos;accès, de rectification,
          d&apos;effacement, de limitation et d&apos;opposition. Comme
          l&apos;éditeur ne détient aucune donnée sur toi, ces demandes
          s&apos;adressent directement à l&apos;hébergeur ou au fournisseur du
          nœud, via les politiques citées plus haut. Ces droits ne
          s&apos;appliquent pas aux transactions déjà inscrites sur la
          blockchain, qui ne peuvent techniquement pas être modifiées. Tu peux
          aussi adresser une réclamation à la{" "}
          <ExternalLink href={site.links.cnil}>CNIL</ExternalLink>.
        </p>
      </LegalSection>

      <LegalSection id="stockage" title="Stockage local et cookies">
        <p>
          Le site ne dépose <strong>aucun cookie</strong>. Ton navigateur garde
          en stockage local (localStorage) les seules informations nécessaires à
          son fonctionnement :
        </p>
        <ul>
          <li>le thème choisi, clair ou sombre ;</li>
          <li>
            l&apos;état de connexion de ton wallet et le dernier connecteur
            utilisé, pour te reconnecter automatiquement ;
          </li>
          <li>
            si tu utilises Base Account, les données de session écrites par le
            SDK de Coinbase.
          </li>
        </ul>
        <p>
          Ces données sont strictement nécessaires au service que tu demandes :
          elles ne requièrent pas de consentement, ne quittent pas ton appareil
          et ne servent à aucun suivi. Vider les données du site dans ton
          navigateur, ou déconnecter ton wallet, les efface. Les polices sont
          servies par le site lui-même, sans appel à un service tiers.
        </p>
      </LegalSection>

      <LegalSection id="avertissement" title="Avertissement">
        <p>
          <strong>Testnet uniquement.</strong> L&apos;ETH de Base Sepolia
          n&apos;a aucune valeur marchande. N&apos;envoie jamais d&apos;ETH réel
          ni de fonds d&apos;un autre réseau vers les contrats du site.
        </p>
        <p>
          <strong>Projet pédagogique.</strong> Pwnpot n&apos;est pas un service
          financier ni un jeu d&apos;argent. Ses contrats n&apos;ont pas fait
          l&apos;objet d&apos;un audit de sécurité.
        </p>
        <p>
          <strong>Épreuves publiées par des tiers</strong> et{" "}
          <strong>arbitre de démonstration</strong> : les règles et les limites
          sont détaillées dans les <InternalLink href="/cgu">CGU</InternalLink>.
        </p>
      </LegalSection>

      <LegalSection id="propriete" title="Propriété intellectuelle">
        <p>
          Le code et le contenu du site appartiennent à leur auteur. Ils ne sont
          pas publiés sous licence libre : toute reproduction demande son
          accord. Le code des contrats déployés reste lisible par tous sur la
          blockchain, comme tout contrat vérifié.
        </p>
        <p>
          Le code de chaque épreuve reste la propriété de l&apos;organisateur
          qui l&apos;a publiée.
        </p>
      </LegalSection>
    </LegalDoc>
  )
}

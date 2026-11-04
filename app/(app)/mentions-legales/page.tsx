import type { Metadata } from "next"

import { site } from "@/lib/site"

export const metadata: Metadata = {
  title: "Mentions légales",
  description:
    "Éditeur, hébergement, confidentialité et avertissement de Pwnpot, projet étudiant sur Base Sepolia.",
}

const sections = [
  { id: "editeur", label: "Éditeur" },
  { id: "hebergement", label: "Hébergement" },
  { id: "confidentialite", label: "Confidentialité" },
  { id: "avertissement", label: "Avertissement" },
  { id: "propriete", label: "Propriété intellectuelle" },
]

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-titre`}
      className="flex scroll-mt-24 flex-col gap-4 border-t pt-10"
    >
      <h2 id={`${id}-titre`} className="text-2xl font-semibold tracking-tight">
        {title}
      </h2>
      <div className="flex flex-col gap-4 leading-7 text-pretty text-muted-foreground [&_strong]:font-medium [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  )
}

function ExternalLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-foreground underline underline-offset-4"
    >
      {children}
    </a>
  )
}

export default function LegalPage() {
  const { editor, host } = site

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[14rem_minmax(0,42rem)] lg:gap-20 lg:px-12 lg:py-24">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <nav aria-label="Sur cette page" className="hidden lg:block">
          <ul className="flex flex-col gap-2.5 text-sm">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <article className="flex flex-col gap-10">
        <header className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Mentions légales
          </h1>
          <p className="text-muted-foreground">
            Pwnpot est un projet étudiant, déployé uniquement sur le réseau de
            test Base Sepolia. Mise à jour : 4 novembre 2026.
          </p>
        </header>

        <Section id="editeur" title="Éditeur">
          <p>
            Ce site est édité à titre non professionnel par{" "}
            <strong>{editor.name}</strong>, dans le cadre du module{" "}
            <strong>{editor.module}</strong> à {editor.school}.
          </p>
          {editor.contact && (
            <p>
              Contact :{" "}
              <a
                href={`mailto:${editor.contact}`}
                className="font-medium text-foreground underline underline-offset-4"
              >
                {editor.contact}
              </a>
            </p>
          )}
        </Section>

        <Section id="hebergement" title="Hébergement">
          <p>
            Le site est hébergé par <strong>{host.name}</strong>, {host.address}{" "}
            (
            <ExternalLink href={host.url}>
              {host.url.replace("https://", "")}
            </ExternalLink>
            ).
          </p>
          <p>
            Les cagnottes, tickets et cautions ne sont pas hébergés par le site
            : ils sont détenus par le contrat CTFPlatform, déployé sur la
            blockchain Base Sepolia.
          </p>
        </Section>

        <Section id="confidentialite" title="Confidentialité">
          <p>
            <strong>Aucun compte, aucune base de données.</strong> Pwnpot
            n&apos;a pas de serveur qui stocke des informations sur toi. Il
            n&apos;y a ni cookie publicitaire, ni outil de mesure
            d&apos;audience.
          </p>
          <p>
            <strong>Ton navigateur garde deux choses en local</strong> : le
            thème choisi (clair ou sombre) et le dernier wallet utilisé, pour te
            reconnecter automatiquement. Ces données restent sur ton appareil ;
            vider les données du site les efface.
          </p>
          <p>
            <strong>Ton adresse de wallet est publique.</strong> Elle est lue
            dans ton navigateur et n&apos;est envoyée à aucun serveur de Pwnpot.
            En revanche, chaque transaction que tu signes (ticket, instance,
            vote, retrait) est inscrite sur la blockchain : elle est publique et
            ne peut pas être effacée.
          </p>
          <p>
            <strong>Services tiers.</strong> Pour lire la blockchain, ton
            navigateur interroge un nœud Base Sepolia, qui voit ton adresse IP
            et les adresses consultées. Si tu te connectes avec Base Account, ce
            service est fourni par Coinbase. L&apos;hébergeur conserve des
            journaux techniques de connexion (voir sa{" "}
            <ExternalLink href={host.privacyUrl}>
              politique de confidentialité
            </ExternalLink>
            ).
          </p>
        </Section>

        <Section id="avertissement" title="Avertissement">
          <p>
            <strong>Testnet uniquement.</strong> L&apos;ETH de Base Sepolia
            n&apos;a aucune valeur marchande. N&apos;envoie jamais d&apos;ETH
            réel ni de fonds d&apos;un autre réseau vers les contrats du site.
          </p>
          <p>
            <strong>Projet pédagogique.</strong> Pwnpot n&apos;est pas un
            service financier ni un jeu d&apos;argent. Ses contrats n&apos;ont
            pas fait l&apos;objet d&apos;un audit de sécurité.
          </p>
          <p>
            <strong>Épreuves publiées par des tiers.</strong> N&apos;importe qui
            peut publier un CTF. Les épreuves sont écrites par leurs
            organisateurs, pas par Pwnpot. Avant d&apos;acheter un ticket,
            vérifie que le code de chaque factory est publié sur Basescan, que
            sa validation ne lit que l&apos;état de ton instance, et
            qu&apos;elle n&apos;est pas un proxy. N&apos;utilise qu&apos;un
            wallet dédié au testnet.
          </p>
          <p>
            <strong>Arbitre de démonstration.</strong> En appel, les litiges
            sont tranchés par un arbitre ERC-792 fixé au déploiement. Pour ce
            projet, c&apos;est un contrat de test (MockArbitrator) contrôlé par
            l&apos;équipe : ses décisions ne sont pas indépendantes.
          </p>
        </Section>

        <Section id="propriete" title="Propriété intellectuelle">
          <p>
            Le code et le contenu du site appartiennent à leur auteur. Le code
            de chaque épreuve reste la propriété de l&apos;organisateur qui
            l&apos;a publiée.
          </p>
        </Section>
      </article>
    </div>
  )
}

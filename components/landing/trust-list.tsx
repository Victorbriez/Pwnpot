// Ce qui reste trusted : README § La feature décentralisée et docs/SECURITY.md.
const items: { risk: string; limit: string }[] = [
  {
    risk: "L'organisateur connaît les solutions.",
    limit:
      "Il peut les fuiter à un complice, et ce n'est pas prouvable on-chain. Sa caution rend la triche coûteuse, et le litige la rend contestable.",
  },
  {
    risk: "Les factories sont écrites par l'organisateur.",
    limit:
      "Une épreuve peut être truquée. Avant de payer, regarde le badge « Code vérifié » (Sourcify), vérifie que validateInstance ne lit que l'état de l'instance et que la factory n'est pas un proxy : le site t'avertit sinon.",
  },
  {
    risk: "L'arbitre tranche seul chaque litige.",
    limit:
      "Il est fixé au déploiement, visible de tous, et ne touche que les fonds du litige. Ici, c'est un MockArbitrator tenu par l'équipe : Kleros, un arbitre décentralisé au même standard, n'existe pas sur Base Sepolia, et demanderait quelques adaptations du contrat.",
  },
  {
    risk: "Un litige peut être ouvert par un complice.",
    limit:
      "Il n'y a qu'un litige par CTF : un complice de l'organisateur peut prendre la place, et sa caution revient alors à l'organisateur. Il perd quand même les frais d'arbitrage, et l'arbitre juge sur les faits, pas sur la personne qui conteste.",
  },
]

export function TrustList() {
  return (
    <dl className="flex flex-col divide-y border-y">
      {items.map((item) => (
        <div
          key={item.risk}
          className="grid gap-2 py-6 md:grid-cols-[minmax(0,16rem)_1fr] md:gap-8"
        >
          <dt className="font-medium text-pretty">{item.risk}</dt>
          <dd className="text-sm leading-6 text-pretty text-muted-foreground">
            {item.limit}
          </dd>
        </div>
      ))}
    </dl>
  )
}

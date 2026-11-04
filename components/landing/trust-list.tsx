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
      "Une épreuve peut être truquée. Avant de payer, vérifie que le code est publié sur Basescan, que validateInstance ne lit que l'état de l'instance et que la factory n'est pas un proxy.",
  },
  {
    risk: "Le vote des joueurs n'est pas neutre.",
    limit:
      "Les perdants ont intérêt à voter « triche », et l'organisateur peut acheter des tickets pour peser. L'appel à l'arbitre corrige ces deux biais.",
  },
  {
    risk: "L'arbitre est trusted en appel.",
    limit:
      "Il est fixé au déploiement et ne touche que les fonds du litige. En démo, c'est un MockArbitrator contrôlé par l'équipe.",
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

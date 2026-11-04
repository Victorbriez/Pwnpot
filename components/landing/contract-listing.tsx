import { cn } from "@/lib/utils"

type Line = {
  code: string
  /** Fonction absente du contrat : affichée barrée. */
  missing?: boolean
  note?: string
}

const lines: Line[] = [
  { code: "contract CTFPlatform {" },
  {
    code: "  function owner();",
    missing: true,
    note: "Pas de propriétaire.",
  },
  {
    code: "  function pause();",
    missing: true,
    note: "Rien ne peut geler les retraits.",
  },
  {
    code: "  function upgradeTo(address);",
    missing: true,
    note: "Pas de proxy : le code déployé est définitif.",
  },
  {
    code: "  function emergencyWithdraw();",
    missing: true,
    note: "Personne ne sort la cagnotte hors des règles.",
  },
  { code: "" },
  {
    code: "  function finalize(uint256 ctfId);",
    note: "N'importe qui clôture après la deadline : si l'organisateur disparaît, le CTF se termine quand même.",
  },
  {
    code: "  function withdraw();",
    note: "Chacun retire sa propre part, quand il veut.",
  },
  {
    code: "  function rule(uint256, uint256);",
    note: "Réservé à l'arbitre ERC-792, fixé au déploiement.",
  },
  {
    code: "  // validateInstance() en staticcall",
    note: "Une épreuve piégée ne peut rien modifier.",
  },
  { code: "}" },
]

export function ContractListing() {
  return (
    <figure className="overflow-hidden rounded-2xl border bg-card">
      <figcaption className="border-b px-5 py-3 font-mono text-xs text-muted-foreground">
        CTFPlatform.sol
      </figcaption>
      <ol className="py-4 font-mono text-[0.78rem] leading-6">
        {lines.map((line, index) => (
          <li
            key={index}
            className="grid grid-cols-[2.5rem_1fr] px-2 md:grid-cols-[2.5rem_minmax(0,19rem)_1fr] md:gap-x-6"
          >
            <span
              aria-hidden
              className="pr-3 text-right text-muted-foreground/50 tabular-nums select-none"
            >
              {index + 1}
            </span>
            <code
              className={cn(
                "min-w-0 [overflow-wrap:anywhere] whitespace-pre-wrap",
                line.missing
                  ? "text-muted-foreground line-through decoration-destructive/80 decoration-2"
                  : "text-secondary-foreground"
              )}
            >
              {line.missing && <span className="sr-only">Absente : </span>}
              {line.code || " "}
            </code>
            {line.note && (
              <span className="col-start-2 pb-2 font-sans text-[0.8125rem] text-muted-foreground md:col-start-3 md:pb-0">
                {line.note}
              </span>
            )}
          </li>
        ))}
      </ol>
    </figure>
  )
}

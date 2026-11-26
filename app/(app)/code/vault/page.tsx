import { readFile } from "node:fs/promises"
import path from "node:path"
import type { Metadata } from "next"
import Link from "next/link"

import { PageHeader, PageShell } from "@/components/site/page-header"
import { TextLink } from "@/components/site/text-link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export const metadata: Metadata = {
  title: "Code du Coffre",
  description:
    "Code source de l'épreuve Coffre (réentrance) et de sa factory, tel que le joue chaque CTF qui la propose.",
}

// Lu au build : la page est statique et suit toujours la version du repo.
const SOURCE = path.join(process.cwd(), "contracts/contracts/levels/Vault.sol")

export default async function VaultCodePage() {
  const source = await readFile(SOURCE, "utf8")
  const lines = source.trimEnd().split("\n")

  return (
    <PageShell>
      <PageHeader
        breadcrumb={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/docs#epreuves" />}>
                  Les épreuves
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Coffre</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
        title="Code du Coffre"
        description={
          <>
            Chaque organisateur déploie son propre Coffre. Le site l&apos;envoie
            à Sourcify dès sa création, qui vérifie que son code est exactement
            celui de ce fichier : le badge « Code vérifié » renvoie alors vers
            Blockscout. En attendant, le site compare lui-même le code déployé,
            octet par octet (hors adresses fixées au déploiement), et affiche «
            Code Pwnpot ». Lis les{" "}
            <TextLink href="/docs#epreuves">règles des épreuves</TextLink>.
          </>
        }
      />
      <figure className="flex flex-col overflow-hidden rounded-xl border bg-card">
        <figcaption className="flex items-center justify-between gap-4 border-b px-4 py-2.5 text-sm">
          <span className="font-mono">Vault.sol</span>
          <span className="text-muted-foreground tabular-nums">
            Solidity 0.8.34 · {lines.length} lignes
          </span>
        </figcaption>
        <pre className="overflow-x-auto py-4 font-mono text-[0.8125rem] leading-6">
          <code className="grid min-w-max grid-cols-[auto_1fr]">
            {lines.map((line, index) => (
              <span key={index} className="contents">
                <span
                  aria-hidden
                  className="pr-4 pl-4 text-right text-muted-foreground tabular-nums select-none"
                >
                  {index + 1}
                </span>
                <span className="pr-6 whitespace-pre">{line || " "}</span>
              </span>
            ))}
          </code>
        </pre>
      </figure>
    </PageShell>
  )
}

import { Badge } from "@/components/ui/badge"
import { vulnLabels, type Vuln } from "@/lib/mock/explore"

const vulnVariant = {
  reentrancy: "brand",
  "tx-origin": "info",
  storage: "success",
  oracle: "warning",
} as const satisfies Record<Vuln, "brand" | "info" | "success" | "warning">

export function VulnTag({ vuln }: { vuln: Vuln }) {
  return (
    <Badge variant={vulnVariant[vuln]} className="h-6 px-2.5">
      {vulnLabels[vuln]}
    </Badge>
  )
}

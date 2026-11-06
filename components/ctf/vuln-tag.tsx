import { Badge } from "@/components/ui/badge"
import { vulnLabels, type Vuln } from "@/lib/ctf/types"

const vulnVariant = {
  reentrancy: "brand",
  "tx-origin": "info",
  storage: "success",
} as const satisfies Record<Vuln, "brand" | "info" | "success">

export function VulnTag({ vuln }: { vuln: Vuln }) {
  return (
    <Badge variant={vulnVariant[vuln]} className="h-6 px-2.5">
      {vulnLabels[vuln]}
    </Badge>
  )
}

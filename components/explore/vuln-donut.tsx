"use client"

import { Label, Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatInt } from "@/lib/format"
import { vulnBreakdown, vulnLabels } from "@/lib/mock/explore"

const chartConfig = {
  solved: { label: "Résolues" },
  reentrancy: { label: vulnLabels.reentrancy, color: "var(--chart-1)" },
  "tx-origin": { label: vulnLabels["tx-origin"], color: "var(--chart-2)" },
  storage: { label: vulnLabels.storage, color: "var(--chart-3)" },
  oracle: { label: vulnLabels.oracle, color: "var(--chart-4)" },
} satisfies ChartConfig

const data = vulnBreakdown.map((row) => ({
  ...row,
  fill: `var(--color-${row.vuln})`,
}))
const total = data.reduce((sum, row) => sum + row.solved, 0)

export function VulnDonut() {
  return (
    <Card className="rounded-2xl py-6 [--card-spacing:--spacing(6)]">
      <CardHeader>
        <CardTitle className="text-[1.0625rem] font-semibold">
          Failles les plus jouées
        </CardTitle>
        <CardDescription>Répartition des épreuves résolues</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-48"
          role="img"
          aria-label={`${formatInt(total)} épreuves résolues, réparties par type de faille.`}
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent nameKey="vuln" hideLabel />}
            />
            <Pie
              data={data}
              dataKey="solved"
              nameKey="vuln"
              innerRadius={66}
              outerRadius={92}
              paddingAngle={3}
              strokeWidth={0}
            >
              <Label
                content={({ viewBox }) => {
                  if (!viewBox || !("cx" in viewBox)) return null
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy ?? 0) - 6}
                        className="fill-foreground text-2xl font-semibold"
                      >
                        {formatInt(total)}
                      </tspan>
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy ?? 0) + 16}
                        className="fill-muted-foreground text-xs"
                      >
                        résolues
                      </tspan>
                    </text>
                  )
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>

        <ul className="flex flex-col gap-3 text-sm">
          {data.map((row) => (
            <li key={row.vuln} className="flex items-center gap-2">
              <span
                aria-hidden
                className="size-2.5 rounded-[3px]"
                style={{ backgroundColor: row.fill }}
              />
              <span className="text-secondary-foreground">
                {vulnLabels[row.vuln]}
              </span>
              <span className="ml-auto font-medium tabular-nums">
                {Math.round((row.solved / total) * 100)} %
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { tvlHistory } from "@/lib/mock/explore"

const ranges = { "7d": 7, "30d": 30, "90d": 90 } as const
type Range = keyof typeof ranges

const chartConfig = {
  total: { label: "Cagnottes totales", color: "var(--chart-1)" },
  tickets: { label: "Dont tickets joueurs", color: "var(--chart-2)" },
} satisfies ChartConfig

const dayFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
})

function formatDay(value: string) {
  return dayFormatter.format(new Date(`${value}T00:00:00Z`))
}

export function TvlChart() {
  const [range, setRange] = React.useState<Range>("30d")
  const data = tvlHistory.slice(-ranges[range])
  const last = data[data.length - 1]

  return (
    <Card className="rounded-2xl py-6 [--card-spacing:--spacing(6)]">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Valeur bloquée dans les cagnottes
        </CardTitle>
        <CardDescription>
          ETH détenus par le contrat de la plateforme
        </CardDescription>
        <CardAction>
          <ToggleGroup
            variant="outline"
            size="sm"
            spacing={0}
            value={[range]}
            onValueChange={(value) => {
              const next = value[0] as Range | undefined
              if (next) setRange(next)
            }}
            aria-label="Période"
          >
            <ToggleGroupItem value="7d">7 j</ToggleGroupItem>
            <ToggleGroupItem value="30d">30 j</ToggleGroupItem>
            <ToggleGroupItem value="90d">90 j</ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-64 w-full lg:h-80"
          role="img"
          aria-label={`Valeur bloquée sur ${ranges[range]} jours : ${last.total} ETH aujourd'hui.`}
        >
          <AreaChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="fill-total" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--color-total)"
                  stopOpacity={0.35}
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-total)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="0" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              minTickGap={40}
              tickFormatter={formatDay}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={36}
              tickFormatter={(value: number) => `${value}`}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => formatDay(String(value))}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="total"
              type="monotone"
              stroke="var(--color-total)"
              strokeWidth={2}
              fill="url(#fill-total)"
            />
            <Area
              dataKey="tickets"
              type="monotone"
              stroke="var(--color-tickets)"
              strokeWidth={2}
              strokeDasharray="4 4"
              fill="transparent"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

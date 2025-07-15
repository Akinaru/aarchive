"use client"

import * as React from "react"
import { Pie, PieChart, Cell, Label } from "recharts"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart"
import { Temps } from "@/types/temps"
import { getColorForTypeTacheStable } from "@/lib/colors"

type Props = {
  temps: Temps[]
}

function formatDuree(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h${m > 0 ? m : ""}` : `${m}min`
}


export function ChartTachePie({ temps }: Props) {
  if (!temps.length) return null

  const totalByType = temps.reduce((acc, t) => {
    const type = t.typeTache?.nom ?? "Inconnu"
    acc[type] = (acc[type] || 0) + t.dureeMinutes
    return acc
  }, {} as Record<string, number>)

  const totalMinutes = Object.values(totalByType).reduce((a, b) => a + b, 0)

  const allTypesSorted = Object.keys(totalByType).sort((a, b) =>
    a.localeCompare(b)
  )

const chartData = allTypesSorted.map((type) => ({
  name: type,
  value: totalByType[type],
  color: getColorForTypeTacheStable(type),
}))

  const chartConfig = Object.fromEntries(
    chartData.map((item) => [
      item.name,
      { label: item.name, color: item.color },
    ])
  )

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Répartition par type de tâche</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={({ active, payload }) => {
                if (active && payload && payload.length > 0) {
                  const entry = payload[0].payload
                  return (
                    <div className="rounded-md border bg-background p-2 text-sm shadow-md">
                      <div className="font-medium">{entry.name}</div>
                      <div className="text-muted-foreground">
                        {formatDuree(entry.value)}
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {formatDuree(totalMinutes)}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 20}
                          className="fill-muted-foreground text-sm"
                        >
                          Total saisi
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="grid gap-1.5 text-sm">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span>{item.name}</span>
            </div>
            <span className="text-muted-foreground">
              {formatDuree(item.value)}
            </span>
          </div>
        ))}
      </CardFooter>
    </Card>
  )
}
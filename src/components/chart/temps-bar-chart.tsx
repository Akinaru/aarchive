"use client"

import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import {
  format,
  startOfWeek,
  addDays,
  isWithinInterval,
  endOfDay,
  addWeeks,
} from "date-fns"
import { fr } from "date-fns/locale"
import { Temps } from "@/types/temps"
import { TypeTache } from "@/types/taches"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { getColorForTypeTacheStable } from "@/lib/colors"

type Props = {
  temps: Temps[]
  typeTaches: TypeTache[]
  navigation?: boolean
}

export function TempsParTypeBarChart({ temps, typeTaches, navigation = true }: Props) {
  const [weekOffset, setWeekOffset] = useState(0)

  const start = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset)
  const end = endOfDay(addDays(start, 6))

  const jours = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i)
    return {
      raw: date,
      date: format(date, "dd/MM"),
      label: format(date, "EEEE", { locale: fr }),
    }
  })

  const grouped: Record<string, Record<string, number>> = {}
  jours.forEach(({ date }) => {
    grouped[date] = {}
  })

  temps.forEach((t) => {
    const date = new Date(t.date)
    if (isWithinInterval(date, { start, end })) {
      const jour = format(date, "dd/MM")
      const type = t.typeTache?.nom ?? "Inconnu"
      grouped[jour][type] = (grouped[jour][type] || 0) + t.dureeMinutes
    }
  })

  const data = jours.map(({ date, label }) => ({
    date,
    label,
    ...grouped[date],
  }))

  const usedTypes = new Set<string>()
  data.forEach((entry) => {
    Object.keys(entry).forEach((key) => {
      if (key !== "date" && key !== "label") usedTypes.add(key)
    })
  })

  const chartConfig: ChartConfig = {}
  Array.from(usedTypes).forEach((type) => {
    chartConfig[type] = {
      label: type,
      color: getColorForTypeTacheStable(type),
    }
  })

  return (
    <div className="space-y-2">
      {navigation && (
        <div className="flex justify-between items-center mb-1 flex-wrap gap-2">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setWeekOffset((prev) => prev - 1)}>
              ⬅ Semaine précédente
            </Button>
            <Button
              variant="outline"
              onClick={() => setWeekOffset(0)}
              disabled={weekOffset === 0}
            >
              🔄 Semaine actuelle
            </Button>
            <Button variant="outline" onClick={() => setWeekOffset((prev) => prev + 1)}>
              Semaine suivante ➡
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            {format(start, "dd MMM yyyy")} – {format(end, "dd MMM yyyy")}
          </div>
        </div>
      )}

      <ChartContainer config={chartConfig} className="w-full">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={6}
              axisLine={false}
              tickFormatter={(value, index) =>
                `${value}\n${jours[index].label.charAt(0).toUpperCase() + jours[index].label.slice(1)}`
              }
              interval={0}
            />
            <Tooltip
              cursor={{ fill: "transparent" }}
              formatter={(value: any) => {
                const v = parseInt(value)
                const h = Math.floor(v / 60)
                const m = v % 60
                return `${h > 0 ? `${h}h` : ""}${m > 0 ? `${m}min` : ""}`
              }}
            />
            {Object.keys(chartConfig).map((key) => (
              <Bar
                key={key}
                dataKey={key}
                fill={chartConfig[key].color}
                stackId="a"
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}
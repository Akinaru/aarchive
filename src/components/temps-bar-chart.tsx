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
  getDay,
} from "date-fns"
import { fr } from "date-fns/locale"
import { Temps } from "@/types/temps"
import { TypeTache } from "@/types/taches"

type Props = {
  temps: Temps[]
  typeTaches: TypeTache[]
}

export function TempsParTypeBarChart({ temps, typeTaches }: Props) {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 })

  const jours = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i)
    return {
      raw: date,
      date: format(date, "dd/MM"),
      label: format(date, "EEEE", { locale: fr }).split("-")[0], // "lundi"
    }
  })

  const grouped: Record<string, Record<string, number>> = {}
  jours.forEach(({ date }) => {
    grouped[date] = {}
  })

  temps.forEach((t) => {
    const date = new Date(t.date)
    if (
      isWithinInterval(date, {
        start,
        end: addDays(start, 7),
      })
    ) {
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

  const colors = [
    "oklch(0.5316 0.1409 355.1999)",
    "oklch(0.5633 0.1912 306.8561)",
    "oklch(0.7227 0.1502 60.5799)",
    "oklch(0.6193 0.2029 312.7422)",
    "oklch(0.6118 0.2093 6.1387)",
    "oklch(0.3649 0.0508 308.4911)",
    "oklch(0.2634 0.0219 309.4748)",
    "oklch(0.3137 0.0306 310.0610)",
    "oklch(0.4607 0.1853 4.0994)",
    "oklch(0.3286 0.0154 343.4461)",
  ]

  const chartConfig: ChartConfig = {}
  Array.from(usedTypes).forEach((type, i) => {
    chartConfig[type] = {
      label: type,
      color: colors[i % colors.length],
    }
  })

return (
  <ChartContainer config={chartConfig} className="w-full">
    <ResponsiveContainer width="100%" height={140}>
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
)

}

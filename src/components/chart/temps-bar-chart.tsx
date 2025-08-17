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
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { getColorForTypeTacheStable } from "@/lib/colors"

type Props = {
  temps: Temps[]
  typeTaches: TypeTache[]
  navigation?: boolean
  requiredDailyMinutes?: number | null
}

function formatMinutesSigned(minutes: number) {
  const sign = minutes < 0 ? "-" : minutes > 0 ? "+" : ""
  const abs = Math.abs(minutes)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  const hm = `${h > 0 ? `${h}h` : ""}${m > 0 ? `${m}min` : h === 0 ? "0min" : ""}`
  return `${sign}${hm}`
}

function formatMinutesPlain(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h > 0 ? `${h}h` : ""}${m > 0 ? `${m}min` : h === 0 ? "0min" : ""}`
}

function CustomTooltip({ active, payload, label, requiredDailyMinutes }: any) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((sum: number, p: any) => sum + (p.value || 0), 0)
  const showTarget = typeof requiredDailyMinutes === "number" && requiredDailyMinutes > 0
  const delta = showTarget ? total - requiredDailyMinutes : null

  return (
    <div className="rounded-md border bg-white p-2 shadow-sm text-sm space-y-1">
      <div className="font-semibold text-black">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex justify-between gap-4">
          <span className="text-[13px]" style={{ color: p.color }}>{p.name}</span>
          <span>{formatMinutesPlain(p.value)}</span>
        </div>
      ))}
      <div className="border-t pt-1 flex justify-between font-semibold text-black">
        <span>Total</span>
        <span>{formatMinutesPlain(total)}</span>
      </div>
      {showTarget && (
        <>
          <div className="flex justify-between text-black">
            <span>Cible</span>
            <span>{formatMinutesPlain(requiredDailyMinutes)}</span>
          </div>
          <div className="flex justify-between font-semibold text-black">
            <span>Écart</span>
            <span className={`${(delta ?? 0) >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {formatMinutesSigned(delta ?? 0)}
            </span>
          </div>
        </>
      )}
    </div>
  )
}

export function TempsParTypeBarChart({
  temps,
  navigation = true,
  requiredDailyMinutes = null,
}: Props) {
  const [weekOffset, setWeekOffset] = useState(0)

  const start = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset)
  const end = endOfDay(addDays(start, 6))

  const jours = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const date = addDays(start, i)
        return {
          raw: date,
          date: format(date, "dd/MM"),
          label: format(date, "EEEE", { locale: fr }),
        }
      }),
    [start]
  )

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

  const weekTotals = useMemo(() => {
    const totalsPerDay = data.map((d) =>
      Object.entries(d).reduce((sum, [k, v]) => {
        if (k === "date" || k === "label") return sum
        return sum + (typeof v === "number" ? v : 0)
      }, 0)
    )
    const worked = totalsPerDay.reduce((a, b) => a + b, 0)
    const show = typeof requiredDailyMinutes === "number" && requiredDailyMinutes > 0
    const target = show ? requiredDailyMinutes * 7 : null
    const delta = show ? worked - (target as number) : null
    return { show, worked, target, delta }
  }, [data, requiredDailyMinutes])

  return (
    <div className="space-y-2">
      {weekTotals.show && (
        <div className="rounded-lg border p-3 flex flex-wrap gap-4 items-center justify-between">
          <div className="text-sm">
            <div className="text-muted-foreground">Cible quotidienne</div>
            <div className="font-medium">{formatMinutesPlain(requiredDailyMinutes as number)}</div>
          </div>
          <div className="text-sm">
            <div className="text-muted-foreground">Total semaine</div>
            <div className="font-medium">{formatMinutesPlain(weekTotals.worked)}</div>
          </div>
          <div className="text-sm">
            <div className="text-muted-foreground">Cible semaine</div>
            <div className="font-medium">
              {weekTotals.target !== null ? formatMinutesPlain(weekTotals.target) : "—"}
            </div>
          </div>
          <div className="text-sm">
            <div className="text-muted-foreground">Écart semaine</div>
            <div className={`font-semibold ${weekTotals.delta !== null && weekTotals.delta >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {weekTotals.delta !== null ? formatMinutesSigned(weekTotals.delta) : "—"}
            </div>
          </div>
        </div>
      )}

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
                `${value}`
              }
              interval={0}
            />
            <Tooltip content={<CustomTooltip requiredDailyMinutes={requiredDailyMinutes} />} />
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

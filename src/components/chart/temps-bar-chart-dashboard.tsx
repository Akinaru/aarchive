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
} from "date-fns"
import { fr } from "date-fns/locale"
import { Temps } from "@/types/temps"
import { TypeTache } from "@/types/taches"
import { useMemo } from "react"
import { getColorForTypeTacheStable } from "@/lib/colors"

type Props = {
  temps: Temps[]
  typeTaches: TypeTache[]
}

function formatMinutesPlain(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h > 0 ? `${h}h` : ""}${m > 0 ? `${m}min` : h === 0 ? "0min" : ""}`
}

function formatEuro(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n)
}

// Couleur du Bar = couleur du TYPE (comme sur la page mission), même si la série = "Mission — Type"
function colorForSeriesFill(seriesKey: string) {
  const type = seriesKey.includes(" — ") ? seriesKey.split(" — ")[1]?.trim() || "Inconnu" : seriesKey
  return getColorForTypeTacheStable(type)
}

// Couleur de contour stable par Mission
function getColorForMissionStable(mission: string) {
  let h = 0
  for (let i = 0; i < mission.length; i++) h = (h << 5) - h + mission.charCodeAt(i)
  const hue = Math.abs(h) % 360
  // teinte stable, contour un peu plus sombre pour contraster
  return `hsl(${hue} 72% 38%)`
}

type DayMissionMeta = {
  minutes: number
  amount: number
  tjm: number
  baseline: number
  types: { type: string; minutes: number }[]
}
type DayMeta = {
  missions: Record<string, DayMissionMeta>
  totalAmount: number
}

// Tooltip groupé par mission, avec minutes + €
function CustomTooltipDashboard({
  active,
  label,
  payload,
  metaByDay,
}: {
  active?: boolean
  label?: string
  payload?: any[]
  metaByDay: Record<string, DayMeta>
}) {
  if (!active || !payload?.length || !label) return null
  const meta = metaByDay[label]
  let grandTotalMinutes = 0
  let grandTotalAmount = 0
  const missionsOrdered: { mission: string; data: DayMissionMeta }[] = []

  if (meta) {
    for (const [mission, data] of Object.entries(meta.missions)) {
      missionsOrdered.push({ mission, data })
      grandTotalMinutes += data.minutes
      grandTotalAmount += data.amount
    }
    missionsOrdered.sort((a, b) => b.data.amount - a.data.amount)
  }

  return (
    <div className="rounded-md border bg-white p-2 shadow-sm text-sm space-y-2 min-w-[260px]">
      <div className="font-semibold text-black">{label}</div>
      <div className="space-y-2">
        {missionsOrdered.map(({ mission, data }) => (
          <div key={mission}>
            <div className="flex items-center justify-between font-medium text-black">
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-sm"
                  style={{ border: `2px solid ${getColorForMissionStable(mission)}` }}
                />
                {mission}
              </span>
              <span>
                {formatMinutesPlain(data.minutes)} &nbsp;•&nbsp; {formatEuro(data.amount || 0)}
              </span>
            </div>
            <ul className="mt-1 pl-3 space-y-0.5">
              {data.types.map((it, i) => (
                <li key={`${mission}-${it.type}-${i}`} className="flex items-center justify-between">
                  <span className="text-[13px] text-muted-foreground">• {it.type}</span>
                  <span className="text-[13px]">{formatMinutesPlain(it.minutes)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t pt-1 flex justify-between font-semibold text-black">
        <span>Total jour</span>
        <span>
          {formatMinutesPlain(grandTotalMinutes)} &nbsp;•&nbsp; {formatEuro(meta?.totalAmount ?? grandTotalAmount)}
        </span>
      </div>
    </div>
  )
}

// Légende Types (remplissage)
function LegendTypes({ seriesKeys }: { seriesKeys: string[] }) {
  const typeColorMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const key of seriesKeys) {
      const type = key.includes(" — ") ? key.split(" — ")[1]?.trim() || "Inconnu" : key
      if (!map.has(type)) map.set(type, getColorForTypeTacheStable(type))
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [seriesKeys])

  if (typeColorMap.length === 0) return null

  return (
    <div className="flex flex-wrap gap-3">
      {typeColorMap.map(([type, color]) => (
        <div key={type} className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
          <span className="text-xs text-muted-foreground">{type}</span>
        </div>
      ))}
    </div>
  )
}

// Légende Missions (contour)
function LegendMissions({ seriesKeys }: { seriesKeys: string[] }) {
  const missions = useMemo(() => {
    const set = new Set<string>()
    for (const key of seriesKeys) {
      const mission = key.includes(" — ") ? key.split(" — ")[0]?.trim() || "Sans mission" : "Sans mission"
      set.add(mission)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [seriesKeys])

  if (missions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-3">
      {missions.map((m) => (
        <div key={m} className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-sm"
            style={{ border: `2px solid ${getColorForMissionStable(m)}` }}
          />
          <span className="text-xs text-muted-foreground">{m}</span>
        </div>
      ))}
    </div>
  )
}

export function TempsBarDashboard({ temps }: Props) {
  // Semaine courante (lundi → dimanche)
  const start = startOfWeek(new Date(), { weekStartsOn: 1 })
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

  /**
   * Structures:
   * - groupedChart[dd/MM]["Mission — Type"] = minutes
   * - metaByDay[dd/MM] = { missions: { [mission]: { minutes, amount, tjm, baseline, types[] } }, totalAmount }
   */
  const { data, usedSeries, metaByDay, weekTotals } = useMemo(() => {
    const groupedChart: Record<string, Record<string, number>> = {}
    const metaByDay: Record<string, DayMeta> = {}

    for (const { date } of jours) {
      groupedChart[date] = {}
      metaByDay[date] = { missions: {}, totalAmount: 0 }
    }

    for (const t of temps) {
      const d = new Date(t.date)
      if (!isWithinInterval(d, { start, end })) continue

      const jour = format(d, "dd/MM")
      const mission = t.mission?.titre ?? "Sans mission"
      const type = t.typeTache?.nom ?? "Inconnu"
      const key = `${mission} — ${type}`
      const minutes = t.dureeMinutes ?? 0

      // 1) Chart stacked séries
      groupedChart[jour][key] = (groupedChart[jour][key] || 0) + minutes

      // 2) Meta pour € par mission
      const tjm = Number(t.mission?.tjm ?? 0)
      const baseline = Math.max(
        1,
        Number(
          t.mission?.requiredDailyMinutes != null && t.mission?.requiredDailyMinutes > 0
            ? t.mission.requiredDailyMinutes
            : 450
        )
      )

      if (!metaByDay[jour].missions[mission]) {
        metaByDay[jour].missions[mission] = {
          minutes: 0,
          amount: 0,
          tjm,
          baseline,
          types: [],
        }
      }
      const mm = metaByDay[jour].missions[mission]
      mm.minutes += minutes
      const existing = mm.types.find((x) => x.type === type)
      if (existing) existing.minutes += minutes
      else mm.types.push({ type, minutes })
    }

    // calcul des montants
    for (const [, meta] of Object.entries(metaByDay)) {
      let totalAmountDay = 0
      for (const [, m] of Object.entries(meta.missions)) {
        const amount = (m.minutes / (m.baseline || 450)) * (m.tjm || 0)
        m.amount = Number(amount.toFixed(2))
        totalAmountDay += m.amount
        m.types.sort((a, b) => b.minutes - a.minutes)
      }
      meta.totalAmount = Number(totalAmountDay.toFixed(2))
    }

    // transformer en data pour recharts
    const data = jours.map(({ date, label }) => ({
      date,
      label,
      ...groupedChart[date],
    }))

    // séries utilisées
    const used = new Set<string>()
    for (const row of data) {
      for (const k of Object.keys(row)) {
        if (k !== "date" && k !== "label") used.add(k)
      }
    }

    // totaux semaine
    const totalMinutesWeek = data.reduce((acc, row) => {
      return (
        acc +
        Object.entries(row).reduce((s, [k, v]) => {
          if (k === "date" || k === "label") return s
          return s + (typeof v === "number" ? v : 0)
        }, 0)
      )
    }, 0)
    const totalAmountWeek = Object.values(metaByDay).reduce((acc, d) => acc + d.totalAmount, 0)

    return {
      data,
      usedSeries: Array.from(used),
      metaByDay,
      weekTotals: {
        minutes: totalMinutesWeek,
        amount: Number(totalAmountWeek.toFixed(2)),
      },
    }
  }, [temps, jours, start, end])

  // ChartConfig (labels = séries, couleurs alignées sur TYPE)
  const chartConfig: ChartConfig = useMemo(() => {
    const cfg: ChartConfig = {}
    for (const serie of usedSeries) {
      cfg[serie] = {
        label: serie,
        color: colorForSeriesFill(serie),
      }
    }
    return cfg
  }, [usedSeries])

  return (
    <div className="space-y-2">
      {/* Bandeau récap semaine */}
      <div className="rounded-lg border p-3 flex flex-wrap gap-4 items-center justify-between">
        <div className="text-sm">
          <div className="text-muted-foreground">Total semaine</div>
          <div className="font-medium">{formatMinutesPlain(weekTotals.minutes)}</div>
        </div>
        <div className="text-sm">
          <div className="text-muted-foreground">Montant semaine</div>
          <div className="font-medium">{formatEuro(weekTotals.amount)}</div>
        </div>
        <div className="text-sm text-muted-foreground">
          {format(start, "dd MMM yyyy")} – {format(end, "dd MMM yyyy")}
        </div>
        {/* Doubles légendes : Types (fill) + Missions (stroke) */}
        <div className="w-full flex flex-col gap-2 mt-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-foreground/80">Types</span>
            <LegendTypes seriesKeys={usedSeries} />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-foreground/80">Missions</span>
            <LegendMissions seriesKeys={usedSeries} />
          </div>
        </div>
      </div>

      {/* Chart */}
      <ChartContainer config={chartConfig} className="w-full">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={6}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
              interval={0}
            />
            <Tooltip content={<CustomTooltipDashboard metaByDay={metaByDay as any} />} />
            {Object.keys(chartConfig).map((key) => {
              const mission = key.includes(" — ") ? key.split(" — ")[0]?.trim() || "Sans mission" : "Sans mission"
              const stroke = getColorForMissionStable(mission)
              return (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={chartConfig[key].color}
                  stroke="#1A191C"
                  strokeWidth={1.5}
                  stackId="a"
                  radius={[4, 4, 0, 0]}
                />
              )
            })}
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}

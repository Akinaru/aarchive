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
  requiredDailyMinutes?: number | null
}

function formatMinutesPlain(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h > 0 ? `${h}h` : ""}${m > 0 ? `${m}min` : h === 0 ? "0min" : ""}`
}

function formatMinutesSigned(minutes: number) {
  const sign = minutes < 0 ? "-" : minutes > 0 ? "+" : ""
  const abs = Math.abs(minutes)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  const hm = `${h > 0 ? `${h}h` : ""}${m > 0 ? `${m}min` : h === 0 ? "0min" : ""}`
  return `${sign}${hm}`
}

function formatEuro(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(n)
}

// Couleur mission (contour)
function getColorForMissionStable(mission: string) {
  let h = 0
  for (let i = 0; i < mission.length; i++) h = (h << 5) - h + mission.charCodeAt(i)
  const hue = Math.abs(h) % 360
  return `hsl(${hue} 72% 38%)`
}

type DayMeta = {
  totalMinutes: number
  totalAmount: number
  types: { type: string; minutes: number }[]
}

function CustomTooltipMission({
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
  const meta = metaByDay[label] ?? { totalMinutes: 0, totalAmount: 0, types: [] }

  return (
    <div className="rounded-md border bg-white p-2 shadow-sm text-sm space-y-2 min-w-[240px]">
      <div className="font-semibold text-black">{label}</div>

      <ul className="space-y-0.5">
        {meta.types.map((it) => (
          <li key={it.type} className="flex items-center justify-between">
            <span className="text-[13px] text-muted-foreground">• {it.type}</span>
            <span className="text-[13px]">{formatMinutesPlain(it.minutes)}</span>
          </li>
        ))}
      </ul>

      <div className="border-t pt-1 flex justify-between font-semibold text-black">
        <span>Total jour</span>
        <span>
          {formatMinutesPlain(meta.totalMinutes)} &nbsp;•&nbsp; {formatEuro(meta.totalAmount)}
        </span>
      </div>
    </div>
  )
}

export function TempsBarMission({
  temps,
  typeTaches,
  requiredDailyMinutes = null,
}: Props) {
  // Semaine courante (lundi → dimanche)
  const start = startOfWeek(new Date(), { weekStartsOn: 1 })
  const end = endOfDay(addDays(start, 6))

  // Nom mission (unique) pour la couleur de contour
  const missionName = useMemo(
    () => temps.find((t) => t.mission?.titre)?.mission?.titre ?? "Mission",
    [temps]
  )
  const missionStroke = getColorForMissionStable(missionName)

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
   * - groupedChart[dd/MM][type] = minutes
   * - metaByDay[dd/MM] = { types:[], totalMinutes, totalAmount }
   * Montant jour = (totalMinutes / baseline) * tjm
   */
  const baseline = useMemo(() => {
    const fromProp =
      typeof requiredDailyMinutes === "number" && requiredDailyMinutes > 0
        ? requiredDailyMinutes
        : null
    // fallback 450 si non fourni
    return Math.max(1, Number(fromProp ?? 450))
  }, [requiredDailyMinutes])

  const tjm = useMemo(() => {
    // On prend le premier tjm présent (toutes les lignes sont la même mission)
    const val = temps.find((t) => t.mission?.tjm != null)?.mission?.tjm ?? 0
    return Number(val) || 0
  }, [temps])

  const { data, usedTypes, metaByDay, weekTotals } = useMemo(() => {
    const groupedChart: Record<string, Record<string, number>> = {}
    const metaByDay: Record<string, DayMeta> = {}

    for (const { date } of jours) {
      groupedChart[date] = {}
      metaByDay[date] = { totalMinutes: 0, totalAmount: 0, types: [] }
    }

    for (const t of temps) {
      const d = new Date(t.date)
      if (!isWithinInterval(d, { start, end })) continue

      const jour = format(d, "dd/MM")
      const type = t.typeTache?.nom ?? "Inconnu"
      const minutes = t.dureeMinutes ?? 0

      // 1) Chart data
      groupedChart[jour][type] = (groupedChart[jour][type] || 0) + minutes

      // 2) Meta jour
      metaByDay[jour].totalMinutes += minutes
      const typeEntry = metaByDay[jour].types.find((x) => x.type === type)
      if (typeEntry) typeEntry.minutes += minutes
      else metaByDay[jour].types.push({ type, minutes })
    }

    // Calcul des montants par jour (à partir de totalMinutes)
    for (const [, meta] of Object.entries(metaByDay)) {
      const amount = (meta.totalMinutes / (baseline || 450)) * (tjm || 0)
      meta.totalAmount = Number(amount.toFixed(2))
      meta.types.sort((a, b) => b.minutes - a.minutes)
    }

    const data = jours.map(({ date, label }) => ({
      date,
      label,
      ...groupedChart[date],
    }))

    const used = new Set<string>()
    for (const row of data) {
      for (const k of Object.keys(row)) {
        if (k !== "date" && k !== "label") used.add(k)
      }
    }

    // Totaux semaine (minutes + €)
    const totalMinutesWeek = Object.values(metaByDay).reduce(
      (acc, d) => acc + d.totalMinutes,
      0
    )
    const totalAmountWeek = Object.values(metaByDay).reduce(
      (acc, d) => acc + d.totalAmount,
      0
    )
    const targetWeek = baseline * 7
    const deltaWeek = totalMinutesWeek - targetWeek

    return {
      data,
      usedTypes: Array.from(used),
      metaByDay,
      weekTotals: {
        totalMinutesWeek,
        totalAmountWeek: Number(totalAmountWeek.toFixed(2)),
        targetWeek,
        deltaWeek,
      },
    }
  }, [temps, jours, start, end, baseline, tjm])

  // ChartConfig (Types => couleurs de remplissage)
  const chartConfig: ChartConfig = useMemo(() => {
    const cfg: ChartConfig = {}
    for (const type of usedTypes) {
      cfg[type] = {
        label: type,
        color: getColorForTypeTacheStable(type),
      }
    }
    return cfg
  }, [usedTypes])

  return (
    <div className="space-y-2">
      {/* Bandeau récap */}
      <div className="rounded-lg border p-3 grid grid-cols-2 md:grid-cols-5 gap-4 items-center">
        <div className="text-sm">
          <div className="text-muted-foreground">Cible quotidienne</div>
          <div className="font-medium">{formatMinutesPlain(baseline)}</div>
        </div>
        <div className="text-sm">
          <div className="text-muted-foreground">Total semaine</div>
          <div className="font-medium">{formatMinutesPlain(weekTotals.totalMinutesWeek)}</div>
        </div>
        <div className="text-sm">
          <div className="text-muted-foreground">Cible semaine</div>
          <div className="font-medium">{formatMinutesPlain(weekTotals.targetWeek)}</div>
        </div>
        <div className="text-sm">
          <div className="text-muted-foreground">Écart semaine</div>
          <div className={`font-semibold ${weekTotals.deltaWeek >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {formatMinutesSigned(weekTotals.deltaWeek)}
          </div>
        </div>
        <div className="text-sm">
          <div className="text-muted-foreground">Montant semaine</div>
          <div className="font-medium">{formatEuro(weekTotals.totalAmountWeek)}</div>
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
            <Tooltip
              content={
                <CustomTooltipMission
                  metaByDay={metaByDay as Record<string, DayMeta>}
                />
              }
            />
            {Object.keys(chartConfig).map((key) => (
              <Bar
                key={key}
                dataKey={key}
                fill={chartConfig[key].color} // TYPE (remplissage)
                stroke={missionStroke}       // MISSION (contour)
                strokeWidth={1.5}
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

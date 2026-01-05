"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  format,
  subMonths,
  addMonths,
  subYears,
  parseISO,
  addDays,
  startOfWeek,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
} from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"
import { generateMonthlyTempsPDF } from "@/lib/exportpdf-month"
import { formatMinutes } from "@/lib/time"
import { Mission } from "@/types/missions"
import { cn } from "@/lib/utils"

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent"

/** =========================
 * Types (API response)
 * ========================= */

type ProjectLite = { id: number; nom: string }

type MissionLite = {
  id: number
  titre: string
  tjm: number | null
  projet: ProjectLite | null
}

type TypeTacheLite = { id: number; nom: string }

type TempsItem = {
  id: number
  date: string // ISO string
  createdAt: string // ISO string
  updatedAt?: string // ISO string
  dureeMinutes: number
  description: string | null
  missionId: number
  typeTacheId: number
  mission: MissionLite
  typeTache: TypeTacheLite
}

type AmountByMission = {
  missionId: number
  titre: string
  tjm: number
  totalMinutes: number
  amount: number
}

type WeekBlock = {
  weekStart: string // ISO
  weekEnd: string // ISO
  temps: TempsItem[]
  totals?: { totalMinutes: number; totalAmount: number }
  byMission?: Record<string, AmountByMission>
}

type TempsMoisResponse = {
  monthStart: string // ISO
  monthEnd: string // ISO
  weeks: WeekBlock[]
  monthlyByMission: Record<string, AmountByMission>
  monthlyTotals: { totalMinutes: number; totalAmount: number }
}

type PrevYearTotals = { totalMinutes: number; totalAmount: number } | null

/** =========================
 * Helpers
 * ========================= */

function formatHoursFromMinutes(totalMinutes: number) {
  const h = totalMinutes / 60
  return h.toLocaleString("fr-FR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
}

function toNumberValue(v: ValueType): number {
  if (typeof v === "number") return v
  if (typeof v === "string") {
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

function formatCurrencyEUR(value: number) {
  return value.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * PDF generator expects Date objects for weekStart/weekEnd (and often for t.date in temps)
 * and a shape compatible with its internal Temps type.
 * Here we keep your old flow, but we convert dates + cast to the function parameter type.
 */
type TempsForPdf = Omit<TempsItem, "date" | "createdAt" | "updatedAt"> & {
  date: Date
  createdAt: Date
  updatedAt?: Date
}

export default function ExportMoisPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<TempsMoisResponse | null>(null)
  const [missions, setMissions] = useState<Mission[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedMissionId, setSelectedMissionId] = useState("all")
  const [prevYearTotals, setPrevYearTotals] = useState<PrevYearTotals>(null)

  const fetchMissions = async () => {
    try {
      const res = await fetch("/api/missions")
      if (res.ok) {
        const json = (await res.json()) as Mission[]
        setMissions(json)
      }
    } catch {
      toast.error("Erreur chargement des missions")
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ date: selectedDate.toISOString() })
      if (selectedMissionId !== "all") params.append("missionId", selectedMissionId)

      const res = await fetch(`/api/temps/mois?${params.toString()}`)
      if (!res.ok) throw new Error("Erreur de chargement")
      const json = (await res.json()) as TempsMoisResponse
      setData(json)

      // comparaison année N-1 (même mois)
      const prevDate = subYears(selectedDate, 1)
      const paramsPrev = new URLSearchParams({ date: prevDate.toISOString() })
      if (selectedMissionId !== "all") paramsPrev.append("missionId", selectedMissionId)

      try {
        const resPrev = await fetch(`/api/temps/mois?${paramsPrev.toString()}`)
        if (resPrev.ok) {
          const jsonPrev = (await resPrev.json()) as TempsMoisResponse
          setPrevYearTotals({
            totalMinutes: jsonPrev.monthlyTotals?.totalMinutes ?? 0,
            totalAmount: jsonPrev.monthlyTotals?.totalAmount ?? 0,
          })
        } else {
          setPrevYearTotals(null)
        }
      } catch {
        setPrevYearTotals(null)
      }
    } catch {
      toast.error("Erreur serveur")
      setData(null)
      setPrevYearTotals(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMissions()
  }, [])

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedMissionId])

  const handleExport = () => {
    if (!data) return

    const weeksForPdf = data.weeks.map((w) => ({
      weekStart: parseISO(w.weekStart),
      weekEnd: parseISO(w.weekEnd),
      temps: w.temps.map<TempsForPdf>((t) => ({
        ...t,
        date: new Date(t.date),
        createdAt: new Date(t.createdAt),
        updatedAt: t.updatedAt ? new Date(t.updatedAt) : undefined,
      })),
    }))

    type WeeklyGroupsParam = Parameters<typeof generateMonthlyTempsPDF>[2]
    const weeks = weeksForPdf as unknown as WeeklyGroupsParam

    generateMonthlyTempsPDF(parseISO(data.monthStart), parseISO(data.monthEnd), weeks)
  }

  const monthLabel = useMemo(
      () => format(selectedDate, "MMMM yyyy", { locale: fr }),
      [selectedDate]
  )

  const monthlyByMission = data?.monthlyByMission ?? {}
  const totalGlobalMinutes = data?.monthlyTotals?.totalMinutes ?? 0
  const totalGlobalFacture = data?.monthlyTotals?.totalAmount ?? 0

  const yoy = useMemo(() => {
    if (!prevYearTotals) return null
    const current = Number(totalGlobalFacture || 0)
    const prev = Number(prevYearTotals.totalAmount || 0)
    const diff = current - prev
    const pct = prev > 0 ? (diff / prev) * 100 : null
    return { prev, diff, pct }
  }, [prevYearTotals, totalGlobalFacture])

  const monthInterval = useMemo(() => {
    const mStart = data?.monthStart ? parseISO(data.monthStart) : startOfMonth(selectedDate)
    const mEnd = data?.monthEnd ? parseISO(data.monthEnd) : endOfMonth(selectedDate)
    return { start: mStart, end: mEnd }
  }, [data?.monthStart, data?.monthEnd, selectedDate])

  const allTempsFlat = useMemo<TempsItem[]>(() => {
    const weeks = data?.weeks ?? []
    return weeks.flatMap((w) => w.temps)
  }, [data])

  // Courbe journalière : heures + montant/jour
  const byDayMonth = useMemo(() => {
    const days: Array<{ date: string; hours: number; amount: number }> = []
    const { start, end } = monthInterval

    const mapMinutes = new Map<string, number>()
    const mapAmount = new Map<string, number>()

    for (const t of allTempsFlat) {
      const d = new Date(t.date)
      if (!isWithinInterval(d, { start, end })) continue
      const key = format(d, "yyyy-MM-dd")

      const minutes = Number(t.dureeMinutes || 0)
      mapMinutes.set(key, (mapMinutes.get(key) ?? 0) + minutes)

      const tjm = Number(t.mission?.tjm ?? 0)
      const amount = (tjm / 450) * minutes
      mapAmount.set(key, (mapAmount.get(key) ?? 0) + amount)
    }

    let cur = start
    while (cur <= end) {
      const key = format(cur, "yyyy-MM-dd")
      const minutes = mapMinutes.get(key) ?? 0
      days.push({
        date: key,
        hours: Number((minutes / 60).toFixed(2)),
        amount: Number((mapAmount.get(key) ?? 0).toFixed(2)),
      })
      cur = addDays(cur, 1)
    }

    return days
  }, [allTempsFlat, monthInterval])

  // Camembert : répartition type tâche
  const byTypeMonthPie = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of allTempsFlat) {
      const name = t.typeTache?.nom ?? "Sans type"
      map.set(name, (map.get(name) ?? 0) + Number(t.dureeMinutes ?? 0))
    }

    const sorted = Array.from(map.entries())
        .map(([label, minutes]) => ({ label, minutes }))
        .sort((a, b) => b.minutes - a.minutes)

    const top = sorted.slice(0, 6)
    const rest = sorted.slice(6).reduce((s, x) => s + x.minutes, 0)
    const merged = rest > 0 ? [...top, { label: "Autres", minutes: rest }] : top

    const fills = [
      "var(--chart-1)",
      "var(--chart-2)",
      "var(--chart-3)",
      "var(--chart-4)",
      "var(--chart-5)",
      "var(--chart-1)",
      "var(--chart-2)",
    ]

    const chartData: Array<{ key: string; type: string; minutes: number; fill: string }> = merged.map(
        (x, idx) => ({
          key: x.label,
          type: x.label,
          minutes: x.minutes,
          fill: fills[idx % fills.length],
        })
    )

    const cfg: ChartConfig = { minutes: { label: "Temps" } }

    return {
      totalMinutes: merged.reduce((s, x) => s + x.minutes, 0),
      chartData,
      config: cfg,
    }
  }, [allTempsFlat])

  // Barres : montant par mission (mois)
  const byMissionMonthForChart = useMemo(() => {
    const entries = Object.values(monthlyByMission)
    const arr = entries
        .map((m) => ({
          missionId: m.missionId,
          titre: m.titre,
          amount: Number(m.amount ?? 0),
          minutes: Number(m.totalMinutes ?? 0),
        }))
        .sort((a, b) => b.amount - a.amount)

    const top = arr.slice(0, 8)
    const restAmount = arr.slice(8).reduce((s, x) => s + x.amount, 0)
    const restMinutes = arr.slice(8).reduce((s, x) => s + x.minutes, 0)

    return restAmount > 0
        ? [...top, { missionId: -1, titre: "Autres", amount: restAmount, minutes: restMinutes }]
        : top
  }, [monthlyByMission])

  // Barres : montant par semaine
  const byWeekForChart = useMemo(() => {
    const weeks = data?.weeks ?? []
    return weeks.map((w, idx) => {
      const amount = Number(w.totals?.totalAmount ?? 0)
      const minutes = w.temps.reduce((s, t) => s + Number(t.dureeMinutes ?? 0), 0)
      const wStart = parseISO(w.weekStart)
      const wEnd = parseISO(w.weekEnd)

      return {
        key: `S${idx + 1}`,
        label: `S${idx + 1}`,
        range: `${format(wStart, "dd/MM")}→${format(wEnd, "dd/MM")}`,
        minutes,
        amount: Number(amount.toFixed(2)),
      }
    })
  }, [data])

  const stats = useMemo(() => {
    const daysWorked = byDayMonth.filter((d) => d.hours > 0).length

    const bestDay = byDayMonth.reduce(
        (acc, d) => (d.amount > acc.amount ? d : acc),
        { date: byDayMonth[0]?.date ?? "", hours: 0, amount: -1 }
    )

    const bestWeek = byWeekForChart.reduce(
        (acc, w) => (w.amount > acc.amount ? w : acc),
        { label: "—", amount: -1, minutes: 0, range: "" }
    )

    const last = byDayMonth[byDayMonth.length - 1]
    const prev = byDayMonth[byDayMonth.length - 2]
    const deltaDay = last && prev ? last.amount - prev.amount : 0

    return { daysWorked, bestDay, bestWeek, deltaDay }
  }, [byDayMonth, byWeekForChart])

  const chartConfigDaily = {
    amount: { label: "€ / jour", color: "var(--chart-1)" },
    hours: { label: "Heures / jour", color: "var(--chart-2)" },
  } satisfies ChartConfig

  const chartConfigWeeks = {
    amount: { label: "Facturé (semaine)", color: "var(--chart-1)" },
  } satisfies ChartConfig

  const chartConfigMissions = {
    amount: { label: "Facturé (mois)", color: "var(--chart-1)" },
  } satisfies ChartConfig

  return (
      <div className="flex flex-col flex-1">
        <PageHeader
            title="Exporter le mois"
            subtitle="Générer un rapport mensuel des temps."
            breadcrumb={[{ label: "Export mois" }]}
        />

        {/* Header / Filtres */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <CardTitle className="leading-tight">
                    <span className="text-muted-foreground font-normal">Mois :</span>{" "}
                    <span className="capitalize">{monthLabel}</span>
                  </CardTitle>
                  <div className="text-xs text-muted-foreground">
                    {format(monthInterval.start, "dd/MM/yyyy", { locale: fr })} →{" "}
                    {format(monthInterval.end, "dd/MM/yyyy", { locale: fr })}
                    {selectedMissionId !== "all" ? " • Filtre mission actif" : ""}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setSelectedDate(subMonths(selectedDate, 1))}>
                    ←
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedDate(addMonths(selectedDate, 1))}>
                    →
                  </Button>
                  <Button onClick={handleExport} disabled={!data || loading}>
                    Exporter PDF
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
                <div className="lg:col-span-4">
                  <Select value={selectedMissionId} onValueChange={setSelectedMissionId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Toutes les missions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les missions</SelectItem>
                      {missions.map((m) => (
                          <SelectItem key={m.id} value={m.id.toString()}>
                            {m.titre}
                          </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="rounded-lg border bg-muted/25 px-3 py-2">
                    <div className="text-[11px] text-muted-foreground">Temps</div>
                    <div className="text-sm font-semibold text-foreground">{formatMinutes(totalGlobalMinutes)}</div>
                  </div>
                  <div className="rounded-lg border bg-muted/25 px-3 py-2">
                    <div className="text-[11px] text-muted-foreground">Heures</div>
                    <div className="text-sm font-semibold text-foreground">
                      {formatHoursFromMinutes(totalGlobalMinutes)} h
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/25 px-3 py-2">
                    <div className="text-[11px] text-muted-foreground">Facturé</div>
                    <div className="text-sm font-semibold text-foreground">
                      {Number(totalGlobalFacture || 0).toFixed(2)} €
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/25 px-3 py-2">
                    <div className="text-[11px] text-muted-foreground">Jours travaillés</div>
                    <div className="text-sm font-semibold text-foreground">{stats.daysWorked}</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-background/40">
                  Meilleur jour :{" "}
                  {stats.bestDay.date ? format(parseISO(stats.bestDay.date), "dd/MM", { locale: fr }) : "—"} •{" "}
                  {stats.bestDay.hours ? `${stats.bestDay.hours.toFixed(2)} h` : "0 h"} •{" "}
                  {Number(stats.bestDay.amount ?? 0).toFixed(2)} €
                </Badge>

                <Badge variant="outline" className="bg-background/40">
                  Meilleure semaine : {stats.bestWeek.label} •{" "}
                  <span className="font-medium text-foreground">
                  {Number(stats.bestWeek.amount ?? 0).toFixed(2)} €
                </span>{" "}
                  <span className="text-muted-foreground">(montant)</span>
                </Badge>

                <Badge
                    variant="outline"
                    className={cn("bg-background/40", stats.deltaDay >= 0 ? "" : "border-destructive/40")}
                >
                  Dernier jour Δ : {stats.deltaDay >= 0 ? "+" : "-"}
                  {Math.abs(stats.deltaDay).toFixed(2)} €
                </Badge>

                {yoy && (
                    <Badge
                        variant="outline"
                        className={cn(
                            "bg-background/40",
                            yoy.diff >= 0 ? "border-emerald-500/30" : "border-destructive/40"
                        )}
                    >
                      vs {format(subYears(selectedDate, 1), "MMMM yyyy", { locale: fr })} :{" "}
                      <span className={cn("font-medium", yoy.diff >= 0 ? "text-emerald-600" : "text-destructive")}>
                    {yoy.diff >= 0 ? "+" : "-"}
                        {formatCurrencyEUR(Math.abs(yoy.diff))}
                  </span>
                      {typeof yoy.pct === "number" ? (
                          <span className="text-muted-foreground"> ({yoy.pct >= 0 ? "+" : ""}{yoy.pct.toFixed(1)}%)</span>
                      ) : null}
                    </Badge>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {loading ? (
            <p className="text-muted-foreground">Chargement...</p>
        ) : !data ? (
            <p className="text-muted-foreground">Aucune donnée.</p>
        ) : (
            <div className="space-y-4">
              {/* Charts row 1 */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                {/* Daily evolution */}
                <Card className="xl:col-span-8">
                  <CardHeader className="pb-2">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                      <div>
                        <CardTitle>Évolution journalière</CardTitle>
                        <div className="text-xs text-muted-foreground">Heures + montant estimé par jour</div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="bg-background/40">
                          Total : {Number(totalGlobalFacture || 0).toFixed(2)} €
                        </Badge>
                        <Badge variant="outline" className="bg-background/40">
                          Heures : {formatHoursFromMinutes(totalGlobalMinutes)} h
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-3">
                    <ChartContainer config={chartConfigDaily} className="aspect-auto h-[260px] w-full">
                      <AreaChart data={byDayMonth}>
                        <defs>
                          <linearGradient id="fillAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-amount)" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="var(--color-amount)" stopOpacity={0.1} />
                          </linearGradient>
                          <linearGradient id="fillHours" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-hours)" stopOpacity={0.55} />
                            <stop offset="95%" stopColor="var(--color-hours)" stopOpacity={0.08} />
                          </linearGradient>
                        </defs>

                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={22}
                            tickFormatter={(value: string) => format(parseISO(value), "d", { locale: fr })}
                        />
                        <YAxis yAxisId="left" tickLine={false} axisLine={false} width={44} tickFormatter={(v: number) => `${v}`} />
                        <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} width={44} tickFormatter={(v: number) => `${v}`} />

                        <ChartTooltip
                            cursor={false}
                            content={
                              <ChartTooltipContent
                                  indicator="dot"
                                  labelFormatter={(value: unknown) =>
                                      format(parseISO(String(value)), "EEEE dd/MM", { locale: fr })
                                  }
                                  formatter={(value: ValueType, name: NameType) => {
                                    const v = toNumberValue(value)
                                    const n = String(name)
                                    if (n === "amount") return [`${v.toFixed(2)} €`, "€ / jour"]
                                    if (n === "hours") return [`${v.toFixed(2)} h`, "Heures / jour"]
                                    return [String(value), n]
                                  }}
                              />
                            }
                        />

                        <Area
                            yAxisId="left"
                            dataKey="amount"
                            type="natural"
                            fill="url(#fillAmount)"
                            stroke="var(--color-amount)"
                            name="amount"
                        />
                        <Area
                            yAxisId="right"
                            dataKey="hours"
                            type="natural"
                            fill="url(#fillHours)"
                            stroke="var(--color-hours)"
                            name="hours"
                        />

                        <ChartLegend content={<ChartLegendContent />} />
                      </AreaChart>
                    </ChartContainer>

                    <div className="mt-2 text-[11px] text-muted-foreground">
                      Montant/jour = estimation (TJM/450 × minutes). Les heures sont converties à partir des minutes.
                    </div>
                  </CardContent>
                </Card>

                {/* Weekly */}
                <Card className="xl:col-span-4">
                  <CardHeader className="pb-2">
                    <CardTitle>Par semaine</CardTitle>
                    <div className="text-xs text-muted-foreground">Montant facturé par semaine</div>
                  </CardHeader>
                  <CardContent className="pt-3">
                    <ChartContainer config={chartConfigWeeks} className="aspect-auto h-[260px] w-full">
                      <BarChart data={byWeekForChart} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                        <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={(v: number) => `${v}`} />

                        <ChartTooltip
                            cursor={false}
                            content={
                              <ChartTooltipContent
                                  indicator="dot"
                                  labelFormatter={(_: unknown, payload) => {
                                    const p = payload?.[0]?.payload as { range?: string; label?: string } | undefined
                                    return p?.range && p?.label ? `${p.label} (${p.range})` : "Semaine"
                                  }}
                                  formatter={(value: ValueType, name: NameType) => {
                                    const v = toNumberValue(value)
                                    const n = String(name)
                                    if (n === "amount") return [`${v.toFixed(2)} €`, "Facturé (semaine)"]
                                    return [String(value), n]
                                  }}
                              />
                            }
                        />

                        <Bar dataKey="amount" fill="var(--color-amount)" radius={8} />
                      </BarChart>
                    </ChartContainer>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-lg border bg-muted/20 p-2">
                        <div className="text-[11px] text-muted-foreground">Meilleure</div>
                        <div className="text-sm font-semibold">{stats.bestWeek.label}</div>
                        <div className="text-[11px] text-muted-foreground">{stats.bestWeek.range}</div>
                      </div>
                      <div className="rounded-lg border bg-muted/20 p-2">
                        <div className="text-[11px] text-muted-foreground">Montant (semaine)</div>
                        <div className="text-sm font-semibold">{Number(stats.bestWeek.amount ?? 0).toFixed(2)} €</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts row 2 */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                {/* Pie types */}
                <Card className="xl:col-span-6 flex flex-col">
                  <CardHeader className="items-center pb-0">
                    <CardTitle>Répartition par type</CardTitle>
                    <div className="text-xs text-muted-foreground">
                      Sur le mois • {formatMinutes(byTypeMonthPie.totalMinutes)}
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 pb-0">
                    <ChartContainer
                        config={byTypeMonthPie.config}
                        className="[&_.recharts-pie-label-text]:fill-foreground mx-auto aspect-square max-h-[280px] pb-0"
                    >
                      <PieChart>
                        <ChartTooltip
                            content={
                              <ChartTooltipContent
                                  hideLabel
                                  formatter={(value: ValueType) => {
                                    const v = toNumberValue(value)
                                    return [formatMinutes(v), "Temps"]
                                  }}
                              />
                            }
                        />
                        <Pie data={byTypeMonthPie.chartData} dataKey="minutes" label nameKey="type" />
                      </PieChart>
                    </ChartContainer>
                  </CardContent>

                  <div className="px-6 pb-4 pt-2">
                    <div className="flex flex-wrap gap-2">
                      {byTypeMonthPie.chartData.map((x) => (
                          <Badge key={x.key} variant="outline" className="bg-background/40">
                            <span className="inline-block size-2 rounded-sm mr-2" style={{ background: x.fill }} />
                            {x.type} • {formatMinutes(x.minutes)}
                          </Badge>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Missions */}
                <Card className="xl:col-span-6">
                  <CardHeader className="pb-2">
                    <CardTitle>Facturation par mission</CardTitle>
                    <div className="text-xs text-muted-foreground">Top missions (mois) — focus montant</div>
                  </CardHeader>
                  <CardContent className="pt-3">
                    {byMissionMonthForChart.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Aucune donnée.</p>
                    ) : (
                        <ChartContainer config={chartConfigMissions} className="aspect-auto h-[260px] w-full">
                          <BarChart
                              data={byMissionMonthForChart.map((m) => ({
                                name: m.titre,
                                amount: Number(m.amount.toFixed(2)),
                                minutes: m.minutes,
                              }))}
                              layout="vertical"
                              margin={{ top: 5, right: 10, bottom: 5, left: 10 }}
                          >
                            <CartesianGrid horizontal={false} />
                            <XAxis
                                type="number"
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(v: number) => `${Math.round(v)}€`}
                            />
                            <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={160} />

                            <ChartTooltip
                                cursor={false}
                                content={
                                  <ChartTooltipContent
                                      indicator="dot"
                                      formatter={(value: ValueType, name: NameType) => {
                                        const v = toNumberValue(value)
                                        const n = String(name)
                                        if (n === "amount") return [`${v.toFixed(2)} €`, "Facturé"]
                                        if (n === "minutes") return [formatMinutes(v), "Temps"]
                                        return [String(value), n]
                                      }}
                                  />
                                }
                            />

                            <Bar dataKey="amount" fill="var(--color-amount)" radius={8} />
                          </BarChart>
                        </ChartContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Weekly details (comme demandé) */}
              <Card>
                <CardHeader>
                  <CardTitle>Détail par semaine</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {data.weeks.map((w, i) => {
                    const weekStart = parseISO(w.weekStart)
                    const weekEnd = parseISO(w.weekEnd)
                    const monthStart = parseISO(data.monthStart)
                    const monthEnd = parseISO(data.monthEnd)

                    const totalMinutes = w.temps.reduce((sum, t) => sum + Number(t.dureeMinutes || 0), 0)

                    const byType: Record<string, number> = {}
                    const byDay: Record<string, number> = {}

                    w.temps.forEach((t) => {
                      const key = t.typeTache.nom
                      byType[key] = (byType[key] || 0) + Number(t.dureeMinutes || 0)
                      const dayKey = format(new Date(t.date), "yyyy-MM-dd")
                      byDay[dayKey] = (byDay[dayKey] || 0) + Number(t.dureeMinutes || 0)
                    })

                    const weekDays = Array.from({ length: 7 }, (_, j) =>
                        addDays(startOfWeek(weekStart, { weekStartsOn: 1 }), j)
                    ).filter((d) => isWithinInterval(d, { start: monthStart, end: monthEnd }))

                    const byMission = w.byMission ?? {}
                    const totalAmountWeek = w.totals?.totalAmount ?? 0

                    return (
                        <Card key={w.weekStart} className="bg-muted/10">
                          <CardHeader className="pb-3">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                              <div className="space-y-1">
                                <CardTitle className="leading-tight">
                                  Semaine {i + 1}{" "}
                                  <span className="text-muted-foreground font-normal">
                              ({format(weekStart, "dd/MM")} - {format(weekEnd, "dd/MM")})
                            </span>
                                </CardTitle>
                                <div className="text-xs text-muted-foreground">
                                  {w.temps.length} entrée{w.temps.length > 1 ? "s" : ""} •{" "}
                                  {Object.keys(byMission).length} mission{Object.keys(byMission).length > 1 ? "s" : ""}
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Badge variant="outline" className="bg-background/40">
                                  {formatMinutes(totalMinutes)}
                                </Badge>
                                <Badge variant="outline" className="bg-background/40">
                                  {Number(totalAmountWeek || 0).toFixed(2)} €
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(byType)
                                  .sort((a, b) => b[1] - a[1])
                                  .map(([type, minutes]) => (
                                      <Badge key={type} variant="outline" className="bg-background/40">
                                        {type} — {formatMinutes(minutes)} (
                                        {totalMinutes > 0 ? ((Number(minutes) / totalMinutes) * 100).toFixed(1) : "0.0"}%)
                                      </Badge>
                                  ))}
                            </div>

                            {Object.keys(byMission).length > 0 && (
                                <div className="space-y-2">
                                  <div className="text-sm font-medium">Gains par mission (semaine)</div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {Object.values(byMission).map((m) => {
                                      const heures = Math.floor(m.totalMinutes / 60)
                                      const minutes = m.totalMinutes % 60
                                      return (
                                          <div key={m.missionId} className="border rounded-lg p-3 shadow-sm bg-background/40">
                                            <div className="flex items-center justify-between">
                                              <div className="font-medium truncate pr-2">{m.titre}</div>
                                              <div className="text-foreground">{m.amount.toFixed(2)} €</div>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                              {heures}h{String(minutes).padStart(2, "0")} • TJM {Number(m.tjm || 0).toFixed(2)} €
                                            </div>
                                          </div>
                                      )
                                    })}
                                  </div>
                                  <div className="flex justify-end text-sm text-muted-foreground">
                            <span>
                              Total semaine :{" "}
                              <span className="text-foreground font-medium">
                                {Number(totalAmountWeek || 0).toFixed(2)} €
                              </span>
                            </span>
                                  </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {weekDays.map((d) => {
                                const key = format(d, "yyyy-MM-dd")
                                const minutes = byDay[key] || 0
                                return (
                                    <div key={key} className={cn("border rounded-lg p-3 shadow-sm bg-background/40")}>
                                      <div className="flex items-center justify-between">
                                        <div className="font-medium">{format(d, "EEEE dd/MM", { locale: fr })}</div>
                                        <div className="text-sm text-muted-foreground">{formatMinutes(minutes)}</div>
                                      </div>
                                    </div>
                                )
                              })}
                            </div>
                          </CardContent>
                        </Card>
                    )
                  })}
                </CardContent>
              </Card>

              <div className="flex justify-end mt-1">
                <Button onClick={handleExport} disabled={!data}>
                  Exporter le PDF
                </Button>
              </div>
            </div>
        )}
      </div>
  )
}

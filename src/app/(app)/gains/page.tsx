"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { toast } from "sonner"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"

type ApiYearResponse = {
  year: number
  months: Array<{
    monthIndex: number // 0..11
    totalMinutes: number
    totalAmount: number
  }>
  totals: {
    totalMinutes: number
    totalAmount: number
  }
}

const MONTHS_SHORT_FR = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
  "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc",
]

function formatEUR(value: number) {
  return value.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

function pct(delta: number, base: number) {
  if (!base) return null
  return (delta / base) * 100
}

async function fetchYear(year: number): Promise<ApiYearResponse> {
  const res = await fetch(`/api/temps/annee?year=${year}`, { cache: "no-store" })
  if (!res.ok) throw new Error("Erreur serveur")
  return res.json()
}

type TimeRange = "12m" | "6m" | "3m"

export default function GainsAnnuelsPage() {
  const currentYear = new Date().getFullYear()

  const [selectedYear, setSelectedYear] = React.useState<number>(currentYear)
  const [timeRange, setTimeRange] = React.useState<TimeRange>("12m")

  const [isLoading, setIsLoading] = React.useState(true)
  const [dataYear, setDataYear] = React.useState<ApiYearResponse | null>(null)
  const [dataPrev, setDataPrev] = React.useState<ApiYearResponse | null>(null)

  const years = React.useMemo(() => {
    const start = currentYear - 6
    const end = currentYear + 1
    return Array.from({ length: end - start + 1 }, (_, i) => start + i).reverse()
  }, [currentYear])

  React.useEffect(() => {
    let cancelled = false

    const run = async () => {
      setIsLoading(true)
      try {
        const [y, p] = await Promise.all([
          fetchYear(selectedYear),
          fetchYear(selectedYear - 1),
        ])
        if (cancelled) return
        setDataYear(y)
        setDataPrev(p)
      } catch {
        if (!cancelled) {
          setDataYear(null)
          setDataPrev(null)
          toast.error("Erreur chargement des gains annuels")
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [selectedYear])

  const monthsFull = React.useMemo(() => {
    const map = new Map<number, number>()
    for (const m of dataYear?.months ?? []) map.set(m.monthIndex, m.totalAmount)

    return Array.from({ length: 12 }, (_, i) => ({
      monthIndex: i,
      monthLabel: MONTHS_SHORT_FR[i],
      amount: map.get(i) ?? 0,
    }))
  }, [dataYear])

  const monthsPrevFull = React.useMemo(() => {
    const map = new Map<number, number>()
    for (const m of dataPrev?.months ?? []) map.set(m.monthIndex, m.totalAmount)

    return Array.from({ length: 12 }, (_, i) => ({
      monthIndex: i,
      amount: map.get(i) ?? 0,
    }))
  }, [dataPrev])

  const rangeCount = React.useMemo(() => {
    if (timeRange === "3m") return 3
    if (timeRange === "6m") return 6
    return 12
  }, [timeRange])

  const filteredChartData = React.useMemo(() => {
    const startIndex = 12 - rangeCount

    return monthsFull
      .filter((m) => m.monthIndex >= startIndex)
      .map((m) => {
        const prev = monthsPrevFull.find((x) => x.monthIndex === m.monthIndex)?.amount ?? 0
        // On met une date stable (1er du mois) pour l'XAxis + tooltip
        const date = `${selectedYear}-${String(m.monthIndex + 1).padStart(2, "0")}-01`
        return {
          date,
          // clés pour recharts
          year: m.amount,
          prev: prev,
          // pour la lisibilité (si besoin)
          monthLabel: m.monthLabel,
        }
      })
  }, [monthsFull, monthsPrevFull, rangeCount, selectedYear])

  const totals = React.useMemo(() => {
    const total = dataYear?.totals.totalAmount ?? 0
    const prev = dataPrev?.totals.totalAmount ?? 0

    const delta = total - prev
    const deltaPct = pct(delta, prev)

    const best = monthsFull.reduce(
      (acc, m) => (m.amount > acc.amount ? m : acc),
      { monthIndex: 0, monthLabel: MONTHS_SHORT_FR[0], amount: -Infinity }
    )

    const nonZero = monthsFull.filter((m) => m.amount > 0)
    const avg = (monthsFull.reduce((s, m) => s + m.amount, 0) / 12) || 0
    const avgNonZero = nonZero.length
      ? nonZero.reduce((s, m) => s + m.amount, 0) / nonZero.length
      : 0

    // évolution MoM sur la plage visible (dernier point vs précédent)
    const last = filteredChartData[filteredChartData.length - 1]
    const prevPoint = filteredChartData[filteredChartData.length - 2]
    const momDelta = last && prevPoint ? last.year - prevPoint.year : null
    const momPct = last && prevPoint ? pct(last.year - prevPoint.year, prevPoint.year) : null

    return {
      total,
      prev,
      delta,
      deltaPct,
      best,
      avg,
      avgNonZero,
      momDelta,
      momPct,
      monthsWithZero: monthsFull.filter((m) => m.amount === 0).length,
    }
  }, [dataYear, dataPrev, monthsFull, filteredChartData])

  const chartConfig = React.useMemo(() => {
    return {
      year: {
        label: `${selectedYear}`,
        color: "var(--chart-1)",
      },
      prev: {
        label: `${selectedYear - 1}`,
        color: "var(--chart-2)",
      },
    } satisfies ChartConfig
  }, [selectedYear])

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Évolution des gains"
        subtitle="Total facturé par mois, avec comparaison N vs N-1."
        breadcrumb={[{ label: "Gains" }]}
      />

      <Card className="mb-4">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle>Gains mensuels</CardTitle>
            <CardDescription>
              Année {selectedYear} (comparaison avec {selectedYear - 1})
            </CardDescription>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:ml-auto">
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setSelectedYear((y) => y - 1)}>
                ←
              </Button>

              <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
                <SelectTrigger className="w-[140px] rounded-lg" aria-label="Choisir une année">
                  <SelectValue placeholder="Année" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)} className="rounded-lg">
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={() => setSelectedYear((y) => y + 1)}>
                →
              </Button>
            </div>

            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
              <SelectTrigger className="w-[170px] rounded-lg" aria-label="Plage">
                <SelectValue placeholder="Plage" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="12m" className="rounded-lg">
                  12 derniers mois (année)
                </SelectItem>
                <SelectItem value="6m" className="rounded-lg">
                  6 derniers mois (année)
                </SelectItem>
                <SelectItem value="3m" className="rounded-lg">
                  3 derniers mois (année)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-6">
          {isLoading ? (
            <>
              <Skeleton className="h-[260px] w-full rounded-lg" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Skeleton className="h-[72px] w-full rounded-lg" />
                <Skeleton className="h-[72px] w-full rounded-lg" />
                <Skeleton className="h-[72px] w-full rounded-lg" />
                <Skeleton className="h-[72px] w-full rounded-lg" />
              </div>
            </>
          ) : !dataYear ? (
            <p className="text-sm text-muted-foreground">Aucune donnée.</p>
          ) : (
            <>
              {/* Résumé / KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Card className="pt-0">
                  <CardHeader className="pb-2">
                    <CardDescription>Total {selectedYear}</CardDescription>
                    <CardTitle className="text-2xl">{formatEUR(totals.total)}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-xs text-muted-foreground">
                      Moyenne (12 mois) :{" "}
                      <span className="font-medium text-foreground">{formatEUR(totals.avg)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="pt-0">
                  <CardHeader className="pb-2">
                    <CardDescription>Évolution vs {selectedYear - 1}</CardDescription>
                    <CardTitle className="text-2xl">
                      {totals.delta >= 0 ? "+" : "-"}
                      {formatEUR(Math.abs(totals.delta))}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={totals.delta >= 0 ? "default" : "destructive"}>
                        {totals.deltaPct === null
                          ? "N/A"
                          : `${totals.deltaPct >= 0 ? "+" : ""}${totals.deltaPct.toFixed(1)}%`}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Total N-1 : {formatEUR(totals.prev)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="pt-0">
                  <CardHeader className="pb-2">
                    <CardDescription>Meilleur mois</CardDescription>
                    <CardTitle className="text-2xl">
                      {MONTHS_SHORT_FR[totals.best.monthIndex]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-xs text-muted-foreground">
                      {formatEUR(totals.best.amount)}
                    </div>
                  </CardContent>
                </Card>

                <Card className="pt-0">
                  <CardHeader className="pb-2">
                    <CardDescription>Évolution dernier mois (plage)</CardDescription>
                    <CardTitle className="text-2xl">
                      {totals.momDelta === null
                        ? "—"
                        : `${totals.momDelta >= 0 ? "+" : "-"}${formatEUR(Math.abs(totals.momDelta))}`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={(totals.momDelta ?? 0) >= 0 ? "default" : "destructive"}>
                        {totals.momPct === null
                          ? "N/A"
                          : `${totals.momPct >= 0 ? "+" : ""}${totals.momPct.toFixed(1)}%`}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Mois à zéro : {totals.monthsWithZero}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Chart */}
              <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
                <AreaChart data={filteredChartData}>
                  <defs>
                    <linearGradient id="fillYear" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-year)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-year)" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="fillPrev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-prev)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-prev)" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid vertical={false} />

                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={18}
                    tickFormatter={(value) => {
                      const d = new Date(value)
                      // "Jan", "Fév", etc.
                      return MONTHS_SHORT_FR[d.getMonth()]
                    }}
                  />

                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        indicator="dot"
                        labelFormatter={(value) => {
                          const d = new Date(value)
                          return `${MONTHS_SHORT_FR[d.getMonth()]} ${d.getFullYear()}`
                        }}
                        formatter={(value: number, name: string) => {
                          const label = name === "year" ? String(selectedYear) : String(selectedYear - 1)
                          return [formatEUR(Number(value ?? 0)), label]
                        }}
                      />
                    }
                  />

                  <Area
                    dataKey="prev"
                    type="natural"
                    fill="url(#fillPrev)"
                    stroke="var(--color-prev)"
                    name="prev"
                  />
                  <Area
                    dataKey="year"
                    type="natural"
                    fill="url(#fillYear)"
                    stroke="var(--color-year)"
                    name="year"
                  />

                  <ChartLegend content={<ChartLegendContent />} />
                </AreaChart>
              </ChartContainer>

              <div className="text-xs text-muted-foreground">
                Calcul basé sur tes temps saisis : <span className="font-medium text-foreground">montant = (TJM / 450) × minutes</span>.
                {" "}
                Moyenne sur mois travaillés :{" "}
                <span className="font-medium text-foreground">{formatEUR(totals.avgNonZero)}</span>.
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

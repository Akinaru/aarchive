// app/(your-page)/export-mois/page.tsx
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { format, subMonths, addMonths, parseISO, addDays, startOfWeek, isWithinInterval } from "date-fns"
import { toast } from "sonner"
import { generateMonthlyTempsPDF } from "@/lib/exportpdf-month"
import { formatMinutes } from "@/lib/time"

export default function ExportMoisPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState(new Date())

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ date: selectedDate.toISOString() })
      const res = await fetch(`/api/temps/mois?${params.toString()}`)
      if (!res.ok) throw new Error("Erreur de chargement")
      const json = await res.json()
      setData(json)
    } catch (e) {
      toast.error("Erreur serveur")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [selectedDate])

  const handleExport = () => {
    if (!data) return
    const weeks = data.weeks.map((w: any) => ({
      weekStart: parseISO(w.weekStart),
      weekEnd: parseISO(w.weekEnd),
      temps: w.temps,
    }))
    generateMonthlyTempsPDF(parseISO(data.monthStart), parseISO(data.monthEnd), weeks)
  }

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Exporter le mois"
        subtitle="Générer un rapport mensuel des temps."
        breadcrumb={[{ label: "Export mois" }]}
      />

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Sélection du mois</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setSelectedDate(subMonths(selectedDate, 1))}>
            ← Mois précédent
          </Button>
          <span className="font-medium">
            {format(selectedDate, "MMMM yyyy", { locale: undefined })}
          </span>
          <Button variant="outline" onClick={() => setSelectedDate(addMonths(selectedDate, 1))}>
            Mois suivant →
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-muted-foreground">Chargement...</p>
      ) : (
        <>
          {data?.weeks.map((w: any, i: number) => {
            const weekStart = parseISO(w.weekStart)
            const weekEnd = parseISO(w.weekEnd)
            const monthStart = parseISO(data.monthStart)
            const monthEnd = parseISO(data.monthEnd)

            const totalMinutes = w.temps.reduce((sum: number, t: any) => sum + t.dureeMinutes, 0)

            const byType: Record<string, number> = {}
            const byDay: Record<string, number> = {}

            w.temps.forEach((t: any) => {
              const key = t.typeTache.nom
              byType[key] = (byType[key] || 0) + t.dureeMinutes
              const dayKey = t.date.slice(0, 10)
              byDay[dayKey] = (byDay[dayKey] || 0) + t.dureeMinutes
            })

            const weekDays = Array.from({ length: 7 }, (_, j) => addDays(startOfWeek(weekStart, { weekStartsOn: 1 }), j))
              .filter((d) => isWithinInterval(d, { start: monthStart, end: monthEnd }))

            return (
              <Card key={i} className="mb-4">
                <CardHeader>
                  <CardTitle>
                    Semaine {i + 1} ({format(weekStart, "dd/MM")} - {format(weekEnd, "dd/MM")}) — {formatMinutes(totalMinutes)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(byType).map(([type, minutes]) => (
                      <Badge key={type} variant="outline">
                        {type} — {formatMinutes(minutes)} ({((minutes / totalMinutes) * 100).toFixed(1)}%)
                      </Badge>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {weekDays.map((d) => {
                      const key = format(d, "yyyy-MM-dd")
                      const minutes = byDay[key] || 0
                      return (
                        <div
                          key={key}
                          className="border rounded-lg p-3 shadow-sm bg-muted/50 break-words"
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{format(d, "EEEE dd/MM")}</div>
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

          <div className="flex justify-end">
            <Button onClick={handleExport}>Exporter le PDF</Button>
          </div>
        </>
      )}
    </div>
  )
}
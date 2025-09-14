"use client"

import { useEffect, useState } from "react"
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
import { format, subMonths, addMonths, parseISO, addDays, startOfWeek, isWithinInterval } from "date-fns"
import { toast } from "sonner"
import { generateMonthlyTempsPDF } from "@/lib/exportpdf-month"
import { formatMinutes } from "@/lib/time"
import { Mission } from "@/types/missions"

export default function ExportMoisPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [missions, setMissions] = useState<Mission[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedMissionId, setSelectedMissionId] = useState("all")

  const fetchMissions = async () => {
    try {
      const res = await fetch("/api/missions")
      if (res.ok) {
        const data = await res.json()
        setMissions(data)
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
      const json = await res.json()
      setData(json)
    } catch {
      toast.error("Erreur serveur")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMissions()
  }, [])

  useEffect(() => {
    fetchData()
  }, [selectedDate, selectedMissionId])

  const handleExport = () => {
    if (!data) return
    const weeks = data.weeks.map((w: any) => ({
      weekStart: parseISO(w.weekStart),
      weekEnd: parseISO(w.weekEnd),
      temps: w.temps,
    }))
    generateMonthlyTempsPDF(parseISO(data.monthStart), parseISO(data.monthEnd), weeks)
  }

  const monthlyByMission = data?.monthlyByMission ?? {}
  const totalGlobalMinutes = data?.monthlyTotals?.totalMinutes ?? 0
  const totalGlobalFacture = data?.monthlyTotals?.totalAmount ?? 0

  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Exporter le mois"
        subtitle="Générer un rapport mensuel des temps."
        breadcrumb={[{ label: "Export mois" }]}
      />

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Filtres & Navigation</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <Button variant="outline" onClick={() => setSelectedDate(subMonths(selectedDate, 1))}>
              ← Mois précédent
            </Button>
            <span className="font-medium">
              {format(selectedDate, "MMMM yyyy", { locale: undefined })}
            </span>
            <Button variant="outline" onClick={() => setSelectedDate(addMonths(selectedDate, 1))}>
              Mois suivant →
            </Button>
          </div>
          <Select value={selectedMissionId} onValueChange={setSelectedMissionId}>
            <SelectTrigger className="w-full sm:w-[220px]">
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
              const dayKey = format(new Date(t.date), "yyyy-MM-dd")
              byDay[dayKey] = (byDay[dayKey] || 0) + t.dureeMinutes
            })

            const weekDays = Array.from({ length: 7 }, (_, j) => addDays(startOfWeek(weekStart, { weekStartsOn: 1 }), j))
              .filter((d) => isWithinInterval(d, { start: monthStart, end: monthEnd }))

            const byMission = w.byMission ?? {}
            const totalAmountWeek = w.totals?.totalAmount ?? 0

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
                        {type} — {formatMinutes(minutes)} ({((Number(minutes) / totalMinutes) * 100).toFixed(1)}%)
                      </Badge>
                    ))}
                  </div>

                  {Object.keys(byMission).length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Gains par mission (semaine)</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.values(byMission).map((m: any) => {
                          const heures = Math.floor(m.totalMinutes / 60)
                          const minutes = m.totalMinutes % 60
                          return (
                            <div key={m.missionId} className="border rounded-lg p-3 shadow-sm bg-muted/50">
                              <div className="flex items-center justify-between">
                                <div className="font-medium truncate pr-2">{m.titre}</div>
                                <div className="text-foreground">{m.amount.toFixed(2)} €</div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {heures}h{minutes > 0 ? minutes : ""} • TJM {m.tjm?.toFixed ? m.tjm.toFixed(2) : Number(m.tjm || 0).toFixed(2)} €
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <div className="flex justify-end text-sm text-muted-foreground">
                        <span>Total semaine : {totalAmountWeek.toFixed(2)} €</span>
                      </div>
                    </div>
                  )}

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

          <Card>
            <CardHeader>
              <CardTitle>Récapitulatif mensuel</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-6">
              {Object.entries(monthlyByMission).map(([id, mission]: [string, any]) => {
                const heures = Math.floor(mission.totalMinutes / 60)
                const minutes = mission.totalMinutes % 60
                const jours = mission.totalMinutes / 450
                const montant = mission.amount ?? 0
                return (
                  <div key={id} className="space-y-1">
                    <div className="font-medium text-foreground">{mission.titre}</div>
                    <div className="flex justify-between">
                      <span>TJM :</span>
                      <span>{Number(mission.tjm || 0).toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Temps travaillé :</span>
                      <span>{heures}h{minutes > 0 ? minutes : ""}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Jours travaillés (7h30) :</span>
                      <span>{jours.toFixed(2)} j</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Montant facturé :</span>
                      <span>{montant.toFixed(2)} €</span>
                    </div>
                  </div>
                )
              })}

              <div className="border-t pt-4 space-y-1 font-medium text-foreground">
                <div className="flex justify-between">
                  <span>Total global :</span>
                  <span>{Math.floor(totalGlobalMinutes / 60)}h{totalGlobalMinutes % 60}</span>
                </div>
                <div className="flex justify-between">
                  <span>Jours travaillés :</span>
                  <span>{(totalGlobalMinutes / 450).toFixed(2)} j</span>
                </div>
                <div className="flex justify-between">
                  <span>Total facturé :</span>
                  <span>{totalGlobalFacture.toFixed(2)} €</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end mt-4">
            <Button onClick={handleExport}>Exporter le PDF</Button>
          </div>
        </>
      )}
    </div>
  )
}

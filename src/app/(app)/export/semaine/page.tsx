// app/(your-page)/export/page.tsx
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { format, addDays, startOfWeek, endOfWeek, subWeeks, addWeeks } from "date-fns"
import { Temps } from "@/types/temps"
import { Mission } from "@/types/missions"
import { formatMinutes } from "@/lib/time"
import { PageHeader } from "@/components/page-header"
import { generateTempsPDF } from "@/lib/exportpdf"

function cleanText(input: string): string {
  return input.replace(/[^\p{L}\p{N}\s\-'.]/gu, "").trim()
}

export default function ExportTempsPage() {
  const [temps, setTemps] = useState<Temps[]>([])
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedMissionId, setSelectedMissionId] = useState("all")

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

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

  const fetchTemps = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ date: selectedDate.toISOString() })
      if (selectedMissionId !== "all") params.append("missionId", selectedMissionId)

      const res = await fetch(`/api/temps/semaine?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setTemps(data)
      } else {
        toast.error("Erreur chargement des temps")
      }
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
    fetchTemps()
  }, [selectedDate, selectedMissionId])

  const totalMinutes = temps.reduce((sum, t) => sum + t.dureeMinutes, 0)
  const byType: Record<string, number> = {}
  const byDate: Record<string, Temps[]> = {}

  temps.forEach((t) => {
    const cleanType = cleanText(t.typeTache.nom)
    byType[cleanType] = (byType[cleanType] || 0) + t.dureeMinutes
    const key = format(new Date(t.date), "yyyy-MM-dd")
    byDate[key] = byDate[key] || []
    byDate[key].push({ ...t, typeTache: { ...t.typeTache, nom: cleanType } })
  })

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <PageHeader
          title="Exporter la semaine"
          subtitle="Générer un rapport hebdomadaire des temps."
          breadcrumb={[{ label: "Export semaine" }]}
        />

        <Card>
          <CardHeader>
            <CardTitle>Filtres & Navigation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 overflow-x-auto">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <Button variant="outline" onClick={() => setSelectedDate(subWeeks(selectedDate, 1))}>
                  ← Semaine précédente
                </Button>
                <span className="text-sm font-medium whitespace-nowrap">
                  {format(weekStart, "dd/MM/yyyy")} - {format(weekEnd, "dd/MM/yyyy")}
                </span>
                <Button variant="outline" onClick={() => setSelectedDate(addWeeks(selectedDate, 1))}>
                  Semaine suivante →
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
            </div>
          </CardContent>
        </Card>

        {loading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Résumé global</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <p className="font-medium mb-2">Total semaine : {formatMinutes(totalMinutes)}</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(byType).map(([type, minutes]) => (
                    <Badge key={type} variant="outline" className="break-words">
                      {type} — {formatMinutes(minutes)} ({((minutes / totalMinutes) * 100).toFixed(1)}%)
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {weekDays.map((dayDate) => {
              const dayKey = format(dayDate, "yyyy-MM-dd")
              const entries = byDate[dayKey] || []
              const dayMinutes = entries.reduce((sum, e) => sum + e.dureeMinutes, 0)
              return (
                <Card key={dayKey}>
                  <CardHeader>
                    <CardTitle className="text-lg break-words">
                      {format(dayDate, "EEEE dd/MM")} — {formatMinutes(dayMinutes)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    {entries.length > 0 ? (
                      <div className="grid gap-3">
                        {entries.map((e) => (
                          <div
                            key={e.id}
                            className="border rounded-lg p-3 shadow-sm bg-muted/50 break-words"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-sm text-muted-foreground italic">
                                  {e.mission.projet.nom}
                                </div>
                                <div className="font-semibold">{e.mission.titre}</div>
                              </div>
                              <Badge className="w-fit">{e.typeTache.nom}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {formatMinutes(e.dureeMinutes)}
                            </div>
                            {e.description && (
                              <div className="text-sm mt-1 break-words">{cleanText(e.description)}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Aucun temps enregistré</p>
                    )}
                  </CardContent>
                </Card>
              )
            })}

            <div className="flex justify-end pt-4">
              <Button onClick={() => generateTempsPDF({ weekStart, weekEnd, temps, byType, byDate, weekDays })}>
                Exporter en PDF
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
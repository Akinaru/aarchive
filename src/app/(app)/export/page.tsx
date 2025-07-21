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
import { toast } from "sonner"
import { format, addDays, startOfWeek, endOfWeek, subWeeks, addWeeks } from "date-fns"
import { Temps } from "@/types/temps"
import { Mission } from "@/types/missions"
import { formatMinutes } from "@/lib/time"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

function cleanText(input: string): string {
  return input.replace(/[^\p{L}\p{N}\s\-'.]/gu, "").trim()
}

export default function ExportTempsPage() {
  const [temps, setTemps] = useState<Temps[]>([])
  const [missions, setMissions] = useState<Mission[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedMissionId, setSelectedMissionId] = useState<string>("all")

  async function fetchMissions() {
    try {
      const res = await fetch("/api/missions")
      if (res.ok) {
        const data: Mission[] = await res.json()
        setMissions(data)
      }
    } catch (err) {
      toast.error("Erreur chargement des missions")
    }
  }

  async function fetchTemps() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ date: selectedDate.toISOString() })
      if (selectedMissionId !== "all") params.append("missionId", selectedMissionId)

      const res = await fetch(`/api/temps/semaine?${params.toString()}`)
      if (res.ok) {
        const data: Temps[] = await res.json()
        setTemps(data)
      } else {
        toast.error("Erreur chargement des temps")
      }
    } catch (err) {
      toast.error("Erreur serveur")
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMissions()
  }, [])

  useEffect(() => {
    fetchTemps()
  }, [selectedDate, selectedMissionId])

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const totalMinutes = temps.reduce((sum, t) => sum + t.dureeMinutes, 0)
  const byType: Record<string, number> = {}
  const byDate: Record<string, Temps[]> = {}

  temps.forEach((t) => {
    const cleanType = cleanText(t.typeTache.nom)
    byType[cleanType] = (byType[cleanType] || 0) + t.dureeMinutes
    const dayKey = format(new Date(t.date), "yyyy-MM-dd")
    byDate[dayKey] = byDate[dayKey] || []
    byDate[dayKey].push({
      ...t,
      typeTache: { ...t.typeTache, nom: cleanType },
    })
  })

function exportToPDF() {
  const doc = new jsPDF()
  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.text("Rapport hebdomadaire des temps", 14, 20)

  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.text("Semaine :", 14, 30)
  doc.setFont("helvetica", "normal")
  doc.text(`${format(weekStart, "dd/MM/yyyy")} -> ${format(weekEnd, "dd/MM/yyyy")}`, 40, 30)

  doc.setFont("helvetica", "bold")
  doc.text("Total semaine :", 14, 38)
  doc.setFont("helvetica", "normal")
  doc.text(`${formatMinutes(totalMinutes)}`, 50, 38)

  // Résumé global
  const globalData = Object.entries(byType).map(([type, minutes]) => [
    type,
    formatMinutes(minutes),
    `${((minutes / totalMinutes) * 100).toFixed(1)}%`,
  ])
  autoTable(doc, {
    head: [["Type", "Durée", "Pourcentage"]],
    body: globalData,
    startY: 45,
  })

  let currentY = doc.lastAutoTable.finalY + 10

  // Détails par jour
  weekDays.forEach((dayDate) => {
    const dayKey = format(dayDate, "yyyy-MM-dd")
    const entries = byDate[dayKey] || []
    const dayMinutes = entries.reduce((sum, e) => sum + e.dureeMinutes, 0)

    doc.setFont("helvetica", "bold")
    doc.text(`${format(dayDate, "EEEE dd/MM")} — ${formatMinutes(dayMinutes)}`, 14, currentY)
    currentY += 6

    if (entries.length > 0) {
      const dayData = entries.map((e) => [
        e.mission.titre,
        e.typeTache.nom,
        formatMinutes(e.dureeMinutes),
        e.description ? cleanText(e.description) : "",
      ])
      autoTable(doc, {
        head: [["Mission", "Type", "Durée", "Description"]],
        body: dayData,
        startY: currentY,
        theme: "grid",
        styles: { fontSize: 10 },
      })
      currentY = doc.lastAutoTable.finalY + 10
    } else {
      doc.setFont("helvetica", "normal")
      doc.text("Aucun temps enregistré", 20, currentY)
      currentY += 10
    }
  })

  doc.save(`rapport-semaine-${format(weekStart, "yyyy-MM-dd")}.pdf`)
}

  return (
    <div className="container py-6 space-y-6">
      {/* Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres & navigation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setSelectedDate(subWeeks(selectedDate, 1))}>
                ← Semaine précédente
              </Button>
              <span className="text-sm font-medium">
                {format(weekStart, "dd/MM/yyyy")} → {format(weekEnd, "dd/MM/yyyy")}
              </span>
              <Button variant="outline" onClick={() => setSelectedDate(addWeeks(selectedDate, 1))}>
                Semaine suivante →
              </Button>
            </div>

            <Select value={selectedMissionId} onValueChange={setSelectedMissionId}>
              <SelectTrigger className="w-[220px]">
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

      {/* Loading */}
      {loading ? (
        <div className="p-4">Chargement...</div>
      ) : (
        <>
          {/* Résumé global */}
          <Card>
            <CardHeader>
              <CardTitle>Résumé global</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium mb-2">Total semaine : {formatMinutes(totalMinutes)}</p>
              <ul className="list-disc list-inside space-y-1">
                {Object.entries(byType).map(([type, minutes]) => (
                  <li key={type}>
                    {type} — {formatMinutes(minutes)} ({((minutes / totalMinutes) * 100).toFixed(1)}%)
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Détails par jour */}
          {weekDays.map((dayDate) => {
            const dayKey = format(dayDate, "yyyy-MM-dd")
            const entries = byDate[dayKey] || []
            const dayMinutes = entries.reduce((sum, e) => sum + e.dureeMinutes, 0)
            return (
              <Card key={dayKey}>
                <CardHeader>
                  <CardTitle>
                    {format(dayDate, "EEEE dd/MM")} — {formatMinutes(dayMinutes)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {entries.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
                      {entries.map((e) => (
                        <li key={e.id}>
                          {e.mission.titre} — {e.typeTache.nom}: {formatMinutes(e.dureeMinutes)}
                          {e.description ? ` — ${cleanText(e.description)}` : ""}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Aucun temps enregistré</p>
                  )}
                </CardContent>
              </Card>
            )
          })}

          {/* Bouton Export PDF */}
          <div className="flex justify-end pt-4">
            <Button onClick={exportToPDF}>Exporter en PDF</Button>
          </div>
        </>
      )}
    </div>
  )
}
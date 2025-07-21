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
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"

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
    const res = await fetch("/api/missions")
    if (res.ok) {
      const data: Mission[] = await res.json()
      setMissions(data)
    }
  }

  async function fetchTemps() {
    setLoading(true)
    const params = new URLSearchParams({ date: selectedDate.toISOString() })
    if (selectedMissionId !== "all") params.append("missionId", selectedMissionId)

    const res = await fetch(`/api/temps/semaine?${params.toString()}`)
    if (res.ok) {
      const data: Temps[] = await res.json()
      setTemps(data)
    } else {
      toast.error("Erreur chargement des temps")
    }
    setLoading(false)
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
    const dayKey = format(new Date(t.date), "yyyy-MM-dd")
    byDate[dayKey] = byDate[dayKey] || []
    byDate[dayKey].push({ ...t, typeTache: { ...t.typeTache, nom: cleanType } })
  })

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="container py-6 space-y-6">
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

      {loading ? (
        <div className="p-4">Chargement...</div>
      ) : (
        <>
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

          <div className="flex justify-end">
            <PDFDownloadLink
              document={<RapportPDF temps={temps} />}
              fileName={`rapport-semaine-${format(weekStart, "yyyy-MM-dd")}.pdf`}
            >
              {({ loading }: { loading: boolean }) => (
                <Button>{loading ? "Génération PDF..." : "Exporter en PDF"}</Button>
              )}
            </PDFDownloadLink>
          </div>
        </>
      )}
    </div>
  )
}

function RapportPDF({ temps }: { temps: Temps[] }) {
  const styles = StyleSheet.create({
    page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },
    header: { fontSize: 18, marginBottom: 20, textAlign: "center", fontWeight: "bold" },
    section: { marginBottom: 14 },
    sectionTitle: { fontSize: 13, marginBottom: 6, borderBottomWidth: 1, paddingBottom: 2 },
    line: { marginBottom: 2 },
  })

  const totalMinutes = temps.reduce((sum, t) => sum + t.dureeMinutes, 0)
  const byType: Record<string, number> = {}
  const byDate: Record<string, Temps[]> = {}

  temps.forEach((t) => {
    const cleanType = cleanText(t.typeTache.nom)
    byType[cleanType] = (byType[cleanType] || 0) + t.dureeMinutes
    const dayKey = format(new Date(t.date), "yyyy-MM-dd")
    byDate[dayKey] = byDate[dayKey] || []
    byDate[dayKey].push({ ...t, typeTache: { ...t.typeTache, nom: cleanType } })
  })

  return (
    <Document>
      <Page style={styles.page}>
        <Text style={styles.header}>Rapport hebdomadaire des temps</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Résumé global</Text>
          <Text>Total semaine : {formatMinutes(totalMinutes)}</Text>
          {Object.entries(byType).map(([type, minutes]) => (
            <Text key={type} style={styles.line}>
              {type} — {formatMinutes(minutes)} ({((minutes / totalMinutes) * 100).toFixed(1)}%)
            </Text>
          ))}
        </View>

        {Object.entries(byDate).map(([day, entries]) => {
          const dayMinutes = entries.reduce((sum, e) => sum + e.dureeMinutes, 0)
          return (
            <View key={day} style={styles.section}>
              <Text style={styles.sectionTitle}>
                {format(new Date(day), "EEEE dd/MM")} — {formatMinutes(dayMinutes)}
              </Text>
              {entries.map((e) => (
                <Text key={e.id} style={styles.line}>
                  {e.mission.titre} — {e.typeTache.nom}: {formatMinutes(e.dureeMinutes)}
                  {e.description ? ` — ${cleanText(e.description)}` : ""}
                </Text>
              ))}
            </View>
          )
        })}
      </Page>
    </Document>
  )
}
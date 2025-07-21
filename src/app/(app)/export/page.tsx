"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { format } from "date-fns"
import { Temps } from "@/types/temps"
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer"
import { formatMinutes } from "@/lib/time"

function cleanText(input: string): string {
  // Supprime les émojis / caractères spéciaux non imprimables
  return input.replace(/[^\p{L}\p{N}\s\-'.]/gu, "").trim()
}

export default function ExportTempsPage() {
  const [temps, setTemps] = useState<Temps[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    async function fetchTemps() {
      const res = await fetch("/api/temps/semaine")
      if (res.ok) {
        const data: Temps[] = await res.json()
        setTemps(data)
      } else {
        toast.error("Erreur chargement des temps")
      }
      setLoading(false)
    }
    fetchTemps()
  }, [])

  if (loading) return <div className="p-4">Chargement...</div>

  const totalMinutes = temps.reduce((sum, t) => sum + t.dureeMinutes, 0)

  const byType: Record<string, number> = {}
  const byDate: Record<string, Temps[]> = {}

  temps.forEach((t) => {
    const cleanType = cleanText(t.typeTache.nom)
    byType[cleanType] = (byType[cleanType] || 0) + t.dureeMinutes
    const day = format(new Date(t.date), "EEEE dd/MM")
    byDate[day] = byDate[day] || []
    byDate[day].push({ ...t, typeTache: { ...t.typeTache, nom: cleanType } })
  })

  return (
    <div className="container py-6 space-y-6">
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

      {Object.entries(byDate).map(([day, entries]) => {
        const dayMinutes = entries.reduce((sum, e) => sum + e.dureeMinutes, 0)
        return (
          <Card key={day}>
            <CardHeader>
              <CardTitle>{day} — {formatMinutes(dayMinutes)}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1">
                {entries.map((e) => (
                  <li key={e.id}>
                    {e.mission.titre} — {e.typeTache.nom}: {formatMinutes(e.dureeMinutes)}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )
      })}

      <div className="flex justify-end">
        <PDFDownloadLink
          document={<RapportPDF temps={temps} />}
          fileName={`rapport-semaine-${format(new Date(), "yyyy-MM-dd")}.pdf`}
        >
          {({ loading }: { loading: boolean }) => (
            <Button>{loading ? "Génération PDF..." : "Exporter en PDF"}</Button>
          )}
        </PDFDownloadLink>
      </div>
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
    const day = format(new Date(t.date), "EEEE dd/MM")
    byDate[day] = byDate[day] || []
    byDate[day].push({ ...t, typeTache: { ...t.typeTache, nom: cleanType } })
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
                {day} — {formatMinutes(dayMinutes)}
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
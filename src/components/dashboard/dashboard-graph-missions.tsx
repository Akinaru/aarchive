"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { TempsParTypeBarChart } from "@/components/chart/temps-bar-chart"
import { TypeTache } from "@/types/taches"
import { Temps } from "@/types/temps"
import { toast } from "sonner"

export function DashboardGraphMissions() {
  const [temps, setTemps] = useState<Temps[]>([])
  const [typeTaches, setTypeTaches] = useState<TypeTache[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resTemps, resTaches] = await Promise.all([
          fetch("/api/dashboard/temps-semaine"),
          fetch("/api/type-tache"),
        ])
        const dataTemps = await resTemps.json()
        const dataTaches = await resTaches.json()
        setTemps(dataTemps)
        setTypeTaches(dataTaches)
      } catch (err) {
        toast.error("Erreur lors du chargement des données")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Temps saisi par type cette semaine</CardTitle>
      </CardHeader>
      <CardContent>
        <TempsParTypeBarChart temps={temps} typeTaches={typeTaches} />
      </CardContent>
    </Card>
  )
}
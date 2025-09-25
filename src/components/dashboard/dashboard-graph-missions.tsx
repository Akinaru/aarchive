"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

import { TempsBarDashboard } from "@/components/chart/temps-bar-chart-dashboard"
import { TypeTache } from "@/types/taches"
import { Temps } from "@/types/temps"

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
      } catch {
        toast.error("Erreur lors du chargement des données")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Temps saisi par mission et type (semaine en cours)</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[320px] w-full rounded-lg" />
        ) : (
          <TempsBarDashboard temps={temps} typeTaches={typeTaches} />
        )}
      </CardContent>
    </Card>
  )
}

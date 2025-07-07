"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { format } from "date-fns"
import { toast } from "sonner"
import Link from "next/link"

import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { TempsParTypeBarChart } from "@/components/chart/temps-bar-chart"
import { FormAddTemps } from "@/components/form/form-ajout-temps"
import { Button } from "@/components/ui/button"

import { Mission } from "@/types/missions"
import { Temps } from "@/types/temps"
import { TypeTache } from "@/types/taches"
import { DataTableTempsMission } from "@/components/table/data-table-temps-mission"
import { ChartTachePie } from "@/components/chart/chart-tache-pie"

export default function MissionSinglePage() {
  const { id } = useParams()
  const [mission, setMission] = useState<Mission | null>(null)
  const [temps, setTemps] = useState<Temps[]>([])
  const [typeTaches, setTypeTaches] = useState<TypeTache[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [resMission, resTemps, resTaches] = await Promise.all([
        fetch(`/api/missions/${id}`),
        fetch(`/api/temps?missionId=${id}`),
        fetch(`/api/type-tache`),
      ])
      const [dataMission, dataTemps, dataTaches] = await Promise.all([
        resMission.json(),
        resTemps.json(),
        resTaches.json(),
      ])
      setMission(dataMission)
      setTemps(dataTemps)
      setTypeTaches(dataTaches)
    } catch {
      toast.error("Erreur lors du chargement des données")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (id) fetchData()
  }, [id])

if (isLoading) {
  return (
    <div className="p-6 space-y-4">
      <Skeleton className="h-24" />
      <Skeleton className="h-[60vh] w-full" />
      <Skeleton className="h-60 w-full" />
    </div>
  )
}


  if (!mission)
    return (
      <Alert variant="destructive">
        <AlertTitle>Mission introuvable</AlertTitle>
        <AlertDescription>
          Impossible de charger la mission avec l'identifiant : {id}
        </AlertDescription>
      </Alert>
    )

  const totalMinutes = temps.reduce((sum, t) => sum + t.dureeMinutes, 0)
  const totalHeures = Math.floor(totalMinutes / 60)
  const totalReste = totalMinutes % 60
  const joursUniques = [...new Set(temps.map(t => format(new Date(t.date), "yyyy-MM-dd")))]

  const lastTemps = [...temps].reverse().slice(0, 10)

  return (
    <div className="p-6 mx-auto space-y-6">
      <PageHeader
        title={mission.titre}
        subtitle={`Projet : ${mission.projet.nom}`}
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Missions", href: "/missions" },
          { label: mission.titre },
        ]}
      />

    <div className="flex flex-col md:flex-row gap-4">
      {/* Graphique 70% */}
      <Card className="w-full md:w-[70%]">
        <CardHeader>
          <CardTitle>Graphique : Répartition de la semaine</CardTitle>
        </CardHeader>
        <CardContent>
          <TempsParTypeBarChart temps={temps} typeTaches={typeTaches} />
        </CardContent>
      </Card>

      {/* Résumé 30% */}
<Card className="w-full md:w-[30%]">
  <CardHeader>
    <CardTitle>Résumé de la mission</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4 text-sm text-muted-foreground">
    <div className="space-y-1">
      <div className="flex justify-between">
        <span>Total saisi :</span>
        <span className="font-medium text-foreground">{totalHeures}h{totalReste}</span>
      </div>
      <div className="flex justify-between">
        <span>Nombre d’entrées :</span>
        <span className="font-medium text-foreground">{temps.length}</span>
      </div>
      <div className="flex justify-between">
        <span>Jours travaillés :</span>
        <span className="font-medium text-foreground">{joursUniques.length}</span>
      </div>
      <div className="flex justify-between">
        <span>Types de tâches utilisés :</span>
        <span className="font-medium text-foreground">
          {[...new Set(temps.map((t) => t.typeTache?.nom ?? "Inconnu"))].length}
        </span>
      </div>
    </div>

    <div className="border-t pt-3 space-y-1">
      <div className="flex justify-between">
        <span>Moyenne / jour :</span>
        <span className="text-foreground">
          {Math.floor((totalMinutes / joursUniques.length) || 0)}h
          {Math.round((totalMinutes / joursUniques.length) % 60) || 0}
        </span>
      </div>
      <div className="flex justify-between">
        <span>Moyenne / entrée :</span>
        <span className="text-foreground">
          {Math.floor((totalMinutes / temps.length) || 0)}min
        </span>
      </div>
      <div className="flex justify-between">
        <span>Premier temps saisi :</span>
        <span className="text-foreground">
          {temps.length > 0 ? format(new Date(temps[temps.length - 1].date), "dd/MM/yyyy") : "-"}
        </span>
      </div>
      {(() => {
        const parJour = temps.reduce((acc, t) => {
          const dateStr = format(new Date(t.date), "yyyy-MM-dd")
          acc[dateStr] = (acc[dateStr] || 0) + t.dureeMinutes
          return acc
        }, {} as Record<string, number>)
        const [maxJour, maxMinutes] =
          Object.entries(parJour).sort((a, b) => b[1] - a[1])[0] || []

        return maxJour ? (
          <div className="flex justify-between">
            <span>Jour le plus chargé :</span>
            <span className="text-foreground">
              {format(new Date(maxJour), "dd/MM")} ({Math.floor(maxMinutes / 60)}h{maxMinutes % 60})
            </span>
          </div>
        ) : null
      })()}
    </div>

    {/* Visualisation par type de tâche */}
    <ChartTachePie temps={temps} />
  </CardContent>
</Card>
    </div>


      <Card>
        <CardHeader><CardTitle>Ajouter un temps</CardTitle></CardHeader>
        <CardContent>
          <FormAddTemps
            missionId={parseInt(id as string)}
            types={typeTaches}
            onAdd={fetchData}
          />
        </CardContent>
      </Card>



      <DataTableTempsMission data={temps} onDelete={async (id) => {
        await fetch(`/api/temps/${id}`, { method: "DELETE" })
        await fetchData()
      } } onEdit={function (): void {
        throw new Error("Function not implemented.")
      } } />
    </div>
  )
}

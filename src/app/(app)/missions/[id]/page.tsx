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
import { TempsParTypeBarChart } from "@/components/temps-bar-chart"
import { FormAddTemps } from "@/components/form/form-ajout-temps"
import { Button } from "@/components/ui/button"

import { Mission } from "@/types/missions"
import { Temps } from "@/types/temps"
import { TypeTache } from "@/types/taches"
import { DataTableTempsMission } from "@/components/table/data-table-temps-mission"

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

  if (isLoading) return <Skeleton className="h-96 w-full" />

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
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div>
            <strong>Total saisi :</strong> {totalHeures}h{totalReste}
          </div>
          <div>
            <strong>Nombre d’entrées :</strong> {temps.length}
          </div>
          <div>
            <strong>Jours de travail :</strong> {joursUniques.length}
          </div>
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


      <Card>
        <CardHeader><CardTitle>10 derniers temps saisis</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {lastTemps.length === 0 ? (
            <p className="text-muted-foreground text-sm">Aucun temps saisi.</p>
          ) : (
            lastTemps.map((t) => {
              const hasType = t.typeTache?.nom
              const hasDescription = t.description && t.description.trim() !== ""

              return (
                <div
                  key={t.id}
                  className="flex justify-between items-start border rounded-lg p-3"
                >
                  <div>
                    <p className="font-medium">{t.typeTache?.nom ?? "Type inconnu"}</p>
                    <p className="text-sm text-muted-foreground">
                      {t.dureeMinutes} min — {format(new Date(t.date), "dd/MM/yyyy HH:mm")}
                    </p>
                    {hasDescription && (
                      <p className="text-sm">{t.description}</p>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <DataTableTempsMission data={temps} onDelete={async (id) => {
        await fetch(`/api/temps/${id}`, { method: "DELETE" })
        await fetchData()
      }} />
    </div>
  )
}

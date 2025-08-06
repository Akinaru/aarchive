"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { format } from "date-fns"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { TempsParTypeBarChart } from "@/components/chart/temps-bar-chart"
import { FormAddTemps } from "@/components/form/form-ajout-temps"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { Mission } from "@/types/missions"
import { Temps } from "@/types/temps"
import { TypeTache } from "@/types/taches"
import { DataTableTempsMission } from "@/components/table/data-table-temps-mission"
import { ChartTachePie } from "@/components/chart/chart-tache-pie"
import { BreadcrumbSkeleton } from "@/components/skeleton/breadcrumb"
import { STATUT_ICONS } from "@/lib/status"

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
        <BreadcrumbSkeleton />
        <div className="grid grid-cols-[70%_30%] gap-4 mt-6">
          <Skeleton className="h-[60vh]" />
          <Skeleton className="h-[60vh]" />
        </div>
        <Skeleton className="h-60 w-full" />
      </div>
    )
  }

  if (!mission)
    return (
      <Alert variant="destructive">
        <AlertTitle>Mission introuvable</AlertTitle>
        <AlertDescription>
          Impossible de charger la mission avec l&apos;identifiant : {id}
        </AlertDescription>
      </Alert>
    )

  const totalMinutes = temps.reduce((sum, t) => sum + t.dureeMinutes, 0)
  const totalHeures = Math.floor(totalMinutes / 60)
  const totalReste = totalMinutes % 60
  const joursUniques = [...new Set(temps.map(t => format(new Date(t.date), "yyyy-MM-dd")))]

  return (
     <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
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
          <Card className="w-full md:w-[70%]">
            <CardHeader>
              <CardTitle>Graphique : Répartition de la semaine</CardTitle>
            </CardHeader>
            <CardContent>
              <TempsParTypeBarChart temps={temps} typeTaches={typeTaches} />
            </CardContent>
          </Card>

          <Card className="w-full md:w-[30%]">
            <CardHeader>
              <CardTitle>Résumé de la mission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>TJM appliqué :</span>
                  <span className="text-foreground">
                    {mission.tjm ? `${(mission.tjm / 100).toFixed(0)} €` : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total saisi :</span>
                  <span className="font-medium text-foreground">{totalHeures}h{totalReste}</span>
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
                  <span>Statut :</span>
                  <span className="flex items-center gap-2 text-foreground capitalize">
                    {(() => {
                      const { icon: Icon, className, spin } = STATUT_ICONS[mission.statut]
                      return <Icon className={`h-4 w-4 ${className} ${spin ? "animate-spin" : ""}`} />
                    })()}
                    {mission.statut.replace("_", " ").toLowerCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Date de début :</span>
                  <span className="text-foreground">
                    {mission.dateDebut ? format(new Date(mission.dateDebut), "dd/MM/yyyy") : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Durée prévue :</span>
                  <span className="text-foreground">
                    {mission.dureePrevueMinutes
                      ? `${Math.floor(mission.dureePrevueMinutes / 60)}h${mission.dureePrevueMinutes % 60 || ""}`
                      : "-"}
                  </span>
                </div>
              </div>

              <ChartTachePie temps={temps} />
            </CardContent>
          </Card>
        </div>

        {(mission.projet.clients?.length ?? 0) > 0 && (
          <Card className="border-muted">
            <CardHeader>
              <CardTitle className="text-base">Clients liés à cette mission</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {mission.projet.clients?.map((pc) => {
                  const client = pc.client
                  return (
                    <div
                      key={client.id}
                      className="flex items-center gap-3 bg-muted/50 rounded-lg px-4 py-2 shadow-sm"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={client.photoPath || ""} alt={client.nom} />
                        <AvatarFallback>{client.nom[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{client.nom}</span>
                        {client.email && (
                          <span className="text-xs text-muted-foreground">{client.email}</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

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

        <DataTableTempsMission
          data={temps}
          types={typeTaches}
          onDelete={async (id) => {
            await fetch(`/api/temps/${id}`, { method: "DELETE" })
            await fetchData()
          }}
          onEdit={fetchData}
        />
      </div>
    </div>
  )
}
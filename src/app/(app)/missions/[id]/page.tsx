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

import { startOfMonth, endOfMonth, isWithinInterval } from "date-fns"


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
    // ⚡️ Skeleton qui respecte exactement la même structure/tailles que le rendu final
    return (
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          {/* Header/Breadcrumb */}
          <BreadcrumbSkeleton />

          {/* Bloc 70/30 identique au rendu final */}
          <div className="flex flex-col md:flex-row gap-4">
            {/* Colonne gauche (70%) – Graphique */}
            <Card className="w-full md:w-[70%]">
              <CardHeader>
                <Skeleton className="h-5 w-1/3" />
              </CardHeader>
              <CardContent>
                {/* hauteur du chart comme en prod */}
                <Skeleton className="h-[300px] w-full rounded-lg" />
              </CardContent>
            </Card>

            {/* Colonne droite (30%) – Résumé */}
            <Card className="w-full md:w-[30%]">
              <CardHeader>
                <Skeleton className="h-5 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                {/* lignes de stats */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-10" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-10" />
                  </div>
                </div>

                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>

                {/* camembert placeholder */}
                <Skeleton className="h-40 w-full rounded-lg" />
              </CardContent>
            </Card>
          </div>

          {/* Clients liés – placeholder (s’aligne sur la même largeur que le rendu final si présent) */}
          <Card className="border-muted">
            <CardHeader>
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 bg-muted/50 rounded-lg px-4 py-2 shadow-sm">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex flex-col">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Formulaire ajout temps */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full md:col-span-3" />
              </div>
              <div className="mt-4">
                <Skeleton className="h-9 w-32" />
              </div>
            </CardContent>
          </Card>

          {/* Tableau des temps */}
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <div className="w-full">
                <div className="grid grid-cols-4 gap-2 mb-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-4 gap-2 py-2 border-b">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-24 justify-self-end" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
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
              <TempsParTypeBarChart
                temps={temps}
                typeTaches={typeTaches}
                requiredDailyMinutes={mission.requiredDailyMinutes ?? null}
              />
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
                    {mission.tjm != null ? `${Number(mission.tjm).toFixed(2)} €` : "-"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Total saisi (mois courant) :</span>
                  <span className="font-medium text-foreground">
                    {(() => {
                      const now = new Date()
                      const monthStart = startOfMonth(now)
                      const monthEnd = endOfMonth(now)
                      const minutes = temps.reduce((sum: number, t: any) => {
                        const d = new Date(t.date)
                        return isWithinInterval(d, { start: monthStart, end: monthEnd })
                          ? sum + (t.dureeMinutes ?? 0)
                          : sum
                      }, 0)
                      const h = Math.floor(minutes / 60)
                      const m = minutes % 60 || ""
                      return `${h}h${m}`
                    })()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Estimation salaire (mois courant) :</span>
                  <span className="font-medium text-foreground">
                    {(() => {
                      const now = new Date()
                      const monthStart = startOfMonth(now)
                      const monthEnd = endOfMonth(now)
                      const minutes = temps.reduce((sum: number, t: any) => {
                        const d = new Date(t.date)
                        return isWithinInterval(d, { start: monthStart, end: monthEnd })
                          ? sum + (t.dureeMinutes ?? 0)
                          : sum
                      }, 0)
                      const montant = mission.tjm ? (Number(mission.tjm) * minutes) / 450 : 0
                      return `${montant.toFixed(2)} €`
                    })()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span>Types de tâches utilisés :</span>
                  <span className="font-medium text-foreground">
                    {[...new Set(temps.map((t: any) => t.typeTache?.nom ?? "Inconnu"))].length}
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
                  <span>Durée cible quotidienne :</span>
                  <span className="text-foreground">
                    {mission.requiredDailyMinutes
                      ? `${Math.floor(mission.requiredDailyMinutes / 60)}h${mission.requiredDailyMinutes % 60 || ""}`
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

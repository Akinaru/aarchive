"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { format } from "date-fns"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { BreadcrumbSkeleton } from "@/components/skeleton/breadcrumb"
import { TempsParTypeBarChart } from "@/components/chart/temps-bar-chart"
import { ChartTachePie } from "@/components/chart/chart-tache-pie"

import { Projet } from "@/types/projets"
import { Temps } from "@/types/temps"
import { TypeTache } from "@/types/taches"

export default function ProjetSinglePage() {
  const { id } = useParams()
  const [projet, setProjet] = useState<Projet | null>(null)
  const [temps, setTemps] = useState<Temps[]>([])
  const [typeTaches, setTypeTaches] = useState<TypeTache[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/projets/${id}/stats`)
        const data = await res.json()
        setProjet(data.projet)
        setTemps(data.temps)
        setTypeTaches(data.typeTaches)
      } catch {
        setProjet(null)
        toast.error("Erreur de chargement des données")
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <BreadcrumbSkeleton />
         <div className="grid grid-cols-3 gap-4 mt-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />

         </div>
        <Skeleton className="h-32" />
        <Skeleton className="h-[60vh]" />
      </div>
    )
  }

  if (!projet) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTitle>Projet introuvable</AlertTitle>
          <AlertDescription>Le projet demandé n'existe pas.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const totalMinutes = temps.reduce((acc, t) => acc + t.dureeMinutes, 0)
  const totalHeures = Math.floor(totalMinutes / 60)
  const totalMissions = projet.missions.length
  const totalClients = projet.clients.length

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={projet.nom}
        subtitle={projet.description || "Projet sans description."}
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Projets", href: "/projets" },
          { label: projet.nom },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total de temps saisi</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{totalHeures}h</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Nombre de missions</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{totalMissions}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Types de tâches</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{typeTaches.length}</CardContent>
        </Card>
      </div>

      {totalClients > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Clients liés au projet</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            {projet.clients.map((pc) => (
              <div
                key={pc.client.id}
                className="flex items-center gap-3 bg-muted/50 rounded-lg px-4 py-2 shadow-sm"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={pc.client.photoPath || ""} alt={pc.client.nom} />
                  <AvatarFallback>{pc.client.nom[0]}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{pc.client.nom}</span>
                  {pc.client.email && (
                    <span className="text-xs text-muted-foreground">{pc.client.email}</span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TempsParTypeBarChart temps={temps} typeTaches={typeTaches} />
        <ChartTachePie temps={temps} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique des temps sur ce projet</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Tableau des temps associés à toutes les missions de ce projet à venir...</p>
        </CardContent>
      </Card>
    </div>
  )
}
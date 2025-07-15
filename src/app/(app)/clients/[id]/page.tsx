"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { TempsParTypeBarChart } from "@/components/chart/temps-bar-chart"
import { ChartTachePie } from "@/components/chart/chart-tache-pie"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Temps } from "@/types/temps"
import { TypeTache } from "@/types/taches"
import { Client } from "@/types/clients"
import { BreadcrumbSkeleton } from "@/components/skeleton/breadcrumb"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { formatMinutes } from "@/lib/time"

export default function ClientSinglePage() {
  const { id } = useParams()
  const [client, setClient] = useState<Client | null>(null)
  const [temps, setTemps] = useState<Temps[]>([])
  const [typeTaches, setTypeTaches] = useState<TypeTache[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/clients/${id}/stats`)
        const data = await res.json()
        setClient(data.client)
        setTemps(data.temps)
        setTypeTaches(data.typeTaches)
      } catch {
        setClient(null)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <BreadcrumbSkeleton />
        <div className="grid grid-cols-2 gap-4 mt-6">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-96" />
        <Skeleton className="h-36" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="p-6">
        <Alert>
          <AlertTitle>Client introuvable</AlertTitle>
          <AlertDescription>Le client demandé n&apos;existe pas.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const totalMinutes = temps.reduce((acc, t) => acc + t.dureeMinutes, 0)
  const totalHeures = formatMinutes(totalMinutes)
  const totalMissions = new Set(temps.map((t) => t.missionId)).size

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={client.nom}
        subtitle={`Email : ${client.email}`}
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Clients", href: "/clients" },
          { label: client.nom },
        ]}
      />

      {/* Infos client */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={client.photoPath || ""} alt={client.nom} />
            <AvatarFallback>{client.nom.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-xl">{client.nom}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          {client.email && (
            <div>
              <p className="font-semibold">Email</p>
              <p>{client.email}</p>
            </div>
          )}
          {client.telephone && (
            <div>
              <p className="font-semibold">Téléphone</p>
              <p>{client.telephone}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total de temps saisi</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{totalHeures}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Nombre de missions</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{totalMissions}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Types de tâches utilisés</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{typeTaches.length}</CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartTachePie temps={temps} />
        <TempsParTypeBarChart temps={temps} typeTaches={typeTaches} />
      </div>

      {/* Placeholder missions */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des missions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Cette section affichera toutes les missions associées à ce client.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
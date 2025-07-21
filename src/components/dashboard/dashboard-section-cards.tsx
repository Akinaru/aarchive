"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Clock,
  CalendarCheck,
  Gauge,
  DollarSign,
} from "lucide-react"

type StatsDashboard = {
  minutesAujourdHui: number
  joursTravaillesMois: number
  moyenneMinutesParJour: number
  estimationSalaire: number
}

export function SectionCards() {
  const [stats, setStats] = useState<StatsDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard/overview")
      .then(res => res.json())
      .then(setStats)
      .catch(err => console.error("Erreur fetch stats:", err))
      .finally(() => setIsLoading(false))
  }, [])

  const formatHeuresMinutes = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${h}h${m > 0 ? m.toString().padStart(2, "0") : ""}`
  }

  const skeletonCard = (
    <Card className="@container/card">
      <CardHeader>
        <Skeleton className="h-4 w-1/3 mb-2" />
        <Skeleton className="h-8 w-2/3 mb-4" />
        <Skeleton className="h-6 w-24" />
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </CardFooter>
    </Card>
  )

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>{skeletonCard}</div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Heures travaillées aujourd’hui</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatHeuresMinutes(stats.minutesAujourdHui)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Clock className="size-4" />
              Aujourd’hui
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">Somme des temps saisis</div>
          <div className="text-muted-foreground">Basé sur la table Temps</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Jours travaillés ce mois</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.joursTravaillesMois}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <CalendarCheck className="size-4" />
              Ce mois
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">Jours avec au moins 1 saisie</div>
          <div className="text-muted-foreground">Filtré par date unique</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Temps moyen / jour</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatHeuresMinutes(stats.moyenneMinutesParJour)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Gauge className="size-4" />
              Moyenne
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">Sur les jours travaillés</div>
          <div className="text-muted-foreground">Ce mois uniquement</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Estimation salaire</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            € {stats.estimationSalaire.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <DollarSign className="size-4" />
              Brut
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">TJM × jours travaillés</div>
          <div className="text-muted-foreground">Basé sur le mois courant</div>
        </CardFooter>
      </Card>
    </div>
  )
}
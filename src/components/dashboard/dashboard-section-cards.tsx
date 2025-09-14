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
import { Clock, CalendarCheck, DollarSign, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

type StatsDashboard = {
  minutesAujourdHui: number
  joursTravaillesMois: number
  moyenneMinutesParJour: number
  estimationSalaire?: number
  missionPopulaire?: {
    id: string
    titre: string
    minutes: number
  } | null
}

type MoisApi = {
  monthStart: string
  monthEnd: string
  weeks: Array<{
    weekStart: string
    weekEnd: string
    temps: any[]
    totals?: { totalMinutes: number; totalAmount: number }
    byMission?: Record<
      string,
      { missionId: number; titre: string; tjm: number; totalMinutes: number; amount: number }
    >
  }>
  monthlyByMission?: Record<
    string,
    { missionId: number; titre: string; tjm: number; totalMinutes: number; amount: number }
  >
  monthlyTotals?: { totalMinutes: number; totalAmount: number }
}

export function SectionCards() {
  const [stats, setStats] = useState<StatsDashboard | null>(null)
  const [mois, setMois] = useState<MoisApi | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    const dateParams = new URLSearchParams({ date: new Date().toISOString() })

    Promise.all([
      fetch("/api/dashboard/overview", { signal: controller.signal })
        .then((r) => r.json())
        .catch((e) => {
          console.error("Erreur fetch /api/dashboard/overview:", e)
          return null
        }),
      fetch(`/api/temps/mois?${dateParams.toString()}`, { signal: controller.signal })
        .then((r) => r.json())
        .catch((e) => {
          console.error("Erreur fetch /api/temps/mois:", e)
          return null
        }),
    ])
      .then(([overview, moisData]) => {
        if (overview) setStats(overview)
        if (moisData) setMois(moisData)
      })
      .finally(() => setIsLoading(false))

    return () => controller.abort()
  }, [])

  const formatHeuresMinutes = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${h}h${m > 0 ? m.toString().padStart(2, "0") : ""}`
  }

  const formatEuro = (value: number) =>
    (value ?? 0).toLocaleString("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 2,
    })

  // Salaire estimé "comme l'export mois" :
  // On priorise monthlyTotals.totalAmount, sinon on somme les weeks.totals.totalAmount
  const salaireEstime = (() => {
    if (!mois) return 0
    if (mois.monthlyTotals?.totalAmount != null) return mois.monthlyTotals.totalAmount
    if (Array.isArray(mois.weeks)) {
      return mois.weeks.reduce(
        (sum, w) => sum + (w.totals?.totalAmount ?? 0),
        0
      )
    }
    return 0
  })()

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
      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>{skeletonCard}</div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Travail</CardDescription>
          <CardTitle className="text-xl font-semibold tabular-nums">
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
          <CardDescription>Jours travaillés</CardDescription>
          <CardTitle className="text-xl font-semibold tabular-nums">
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

      {/* Carte salaire estimé toutes missions confondues — alignée sur la logique de l'export mensuel */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Salaire estimé</CardDescription>
          <CardTitle className="text-xl font-semibold tabular-nums">
            {formatEuro(salaireEstime)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <DollarSign className="size-4" />
              Salaire
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">Projection mensuelle</div>
          <div className="text-muted-foreground">
            Toutes missions cumulées
          </div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Mission populaire</CardDescription>
          <CardTitle className="text-xl font-semibold tabular-nums">
            {stats.missionPopulaire?.titre ?? "—"}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Star className="size-4" />
              Populaire
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-2 text-sm">
          {stats.missionPopulaire && (
            <Link href={`/missions/${stats.missionPopulaire.id}`}>
              <Button variant="outline" size="sm" className="w-full">
                Voir la mission
              </Button>
            </Link>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

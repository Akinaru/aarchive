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

import { STATUT_ICONS } from "@/lib/status"

type StatsDashboard = {
  projetsActifs: number
  missionsEnCours: number
  totalTempsMinutes: number
  clientsActifs: number
}

export function SectionCards() {
  const [stats, setStats] = useState<StatsDashboard | null>(null)

  useEffect(() => {
    fetch("/api/dashboard/overview")
      .then((res) => res.json())
      .then(setStats)
      .catch((err) => console.error("Erreur fetch stats:", err))
  }, [])

  if (!stats) return null

  const heures = Math.floor(stats.totalTempsMinutes / 60)
  const minutes = stats.totalTempsMinutes % 60
  const tempsFormat = `${heures}h${minutes > 0 ? minutes.toString().padStart(2, "0") : ""}`

  const statut = STATUT_ICONS["EN_COURS"]
  const Icon = statut.icon

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Projets actifs</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.projetsActifs}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">Stable</Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">Projets liés à au moins une mission</div>
          <div className="text-muted-foreground">Filtré côté API</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Missions en cours</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.missionsEnCours}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <Icon
                className={`size-4 ${statut.className} ${statut.spin ? "animate-spin" : ""}`}
              />
              EN_COURS
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">Statut = EN_COURS</div>
          <div className="text-muted-foreground">Mise à jour en temps réel</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Temps total saisi</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {tempsFormat}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">+ suivi</Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">Toutes missions confondues</div>
          <div className="text-muted-foreground">Basé sur la table Temps</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Clients actifs</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.clientsActifs}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">+ fidélité</Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="flex gap-2 font-medium">Ayant au moins 1 projet</div>
          <div className="text-muted-foreground">Comptabilisé côté base</div>
        </CardFooter>
      </Card>
    </div>
  )
}
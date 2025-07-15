"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { AlertTriangle, CheckCircle } from "lucide-react"

type Paiement = {
  id: number | null
  mois: string
  montant: number
  estimation: number
  jours: number
  paye: boolean
}

type Stats = {
  tjm: number
  totalMontant: number
  totalEstimation: number
  totalPaye6: number
  totalEstime6: number
  variationMoy: number
  moisManquants: string[]
}

export function BlocStatsMonetaires() {
  const [, setData] = useState<Paiement[]>([])
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch("/api/monnaie/stats")
      .then((res) => res.json())
      .then((res) => {
        setData(res.paiements)
        setStats(res.stats)
      })
  }, [])

  if (!stats) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>📊 Statistiques monétaires</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.moisManquants.length > 0 ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Mois manquants</AlertTitle>
            <AlertDescription>
              Aucun paiement enregistré pour {stats.moisManquants.length} mois :{" "}
              <strong>
                {stats.moisManquants
                  .map((m) =>
                    new Date(m).toLocaleDateString("fr-FR", {
                      month: "long",
                      year: "numeric",
                    })
                  )
                  .join(", ")}
              </strong>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="default">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <AlertTitle>Tous les mois sont renseignés</AlertTitle>
            <AlertDescription>Bravo, aucun mois manquant 🎉</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="bg-muted rounded-xl p-4">
            <div className="text-muted-foreground">Total payé</div>
            <div className="text-lg font-semibold">
              {stats.totalMontant.toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}
            </div>
          </div>
          <div className="bg-muted rounded-xl p-4">
            <div className="text-muted-foreground">Total estimé</div>
            <div className="text-lg font-semibold">
              {stats.totalEstimation.toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}
            </div>
          </div>
          <div className="bg-muted rounded-xl p-4">
            <div className="text-muted-foreground">Variation moyenne</div>
            <div
              className={`text-lg font-semibold ${
                stats.variationMoy < 0 ? "text-red-600" : "text-green-600"
              }`}
            >
              {stats.variationMoy.toFixed(1)}%
            </div>
          </div>
          <div className="bg-muted rounded-xl p-4">
            <div className="text-muted-foreground">Payé sur 6 mois</div>
            <div className="text-lg font-semibold">
              {stats.totalPaye6.toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}
            </div>
          </div>
          <div className="bg-muted rounded-xl p-4">
            <div className="text-muted-foreground">Estimé sur 6 mois</div>
            <div className="text-lg font-semibold">
              {stats.totalEstime6.toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}
            </div>
          </div>
          <div className="bg-muted rounded-xl p-4">
            <div className="text-muted-foreground">TJM actuel</div>
            <div className="text-lg font-semibold">
              {stats.tjm.toLocaleString("fr-FR", {
                style: "currency",
                currency: "EUR",
              })}{" "}
              / jour
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
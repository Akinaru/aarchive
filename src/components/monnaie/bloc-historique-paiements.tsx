"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Skeleton } from "@/components/ui/skeleton"

type Paiement = {
  id: number
  mois: string // ISO date string
  montant: number
  estimation: number
}

export function BlocHistoriquePaiements() {
  const [data, setData] = useState<Paiement[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/monnaie/paiements")
      const json = await res.json()
      setData(json)
      setIsLoading(false)
    }
    fetchData()
  }, [])

  const chartData = data.map((p) => ({
    name: format(new Date(p.mois), "MMM yyyy", { locale: fr }),
    montant: p.montant,
    estimation: p.estimation,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des paiements</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        {isLoading ? (
          <Skeleton className="h-full w-full rounded-lg" />
        ) : chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun paiement enregistré.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorMontant" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="colorEstimation" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(value: number, name: string) => {
                  const label =
                    name === "montant"
                      ? "Montant réel"
                      : name === "estimation"
                      ? "Estimation"
                      : name
                  return [`${value.toFixed(2)} €`, label]
                }}
              />
              <Area
                type="monotone"
                dataKey="montant"
                stroke="#4f46e5"
                fill="url(#colorMontant)"
                name="Montant réel"
              />
              <Area
                type="monotone"
                dataKey="estimation"
                stroke="#10b981"
                fill="url(#colorEstimation)"
                name="Estimation"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts"
import { TrendingUp } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"

const MONTHS_SHORT_FR = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
  "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"
]

type Paiement = {
  mois: string
  montant: number
}

const chartConfig = {
  montant: {
    label: "Paiement",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export function ChartBarPaiementsAnnuels() {
  const [data, setData] = useState<{ month: string; montant: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch("/api/monnaie/paiements")
      .then((res) => res.json())
      .then((paiements: Paiement[]) => {
        const currentYear = new Date().getFullYear()
        const filtered = paiements.filter(
          (p) => new Date(p.mois).getFullYear() === currentYear
        )

        const mapped = Array.from({ length: 12 }, (_, i) => {
          const moisData = filtered.find(
            (p) => new Date(p.mois).getMonth() === i
          )
          return {
            month: MONTHS_SHORT_FR[i],
            montant: moisData?.montant ?? 0,
          }
        })

        setData(mapped)
      })
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Paiements mensuels</CardTitle>
          <CardDescription>Année {new Date().getFullYear()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-80 w-full rounded-lg" />
          <Skeleton className="h-3 w-full rounded-lg" />
        </CardContent>
        <CardFooter className="flex-col items-start gap-2 text-sm">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paiements mensuels</CardTitle>
        <CardDescription>Année {new Date().getFullYear()}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart data={data} margin={{ top: 20 }} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <Bar dataKey="montant" fill="var(--color-montant)" radius={8}>
              <LabelList
                dataKey="montant"
                position="top"
                offset={10}
                className="fill-foreground"
                fontSize={12}
                formatter={(label: number) =>
                  label.toLocaleString("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })
                }
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          Suivi des paiements <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Montants réellement reçus par mois.
        </div>
      </CardFooter>
    </Card>
  )
}
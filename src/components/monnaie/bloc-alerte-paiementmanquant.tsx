"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export function AlertePaiementManquant() {
  const [paiementFait, setPaiementFait] = useState(true)

  useEffect(() => {
    const now = new Date()
    const currentMonth = now.toISOString().slice(0, 7) // "2025-07"

    fetch("/api/monnaie/paiements")
      .then((res) => res.json())
      .then((data: { mois: string }[]) => {
        const existe = data.some((p) => p.mois.startsWith(currentMonth))
        setPaiementFait(existe)
      })
  }, [])

  if (paiementFait) return null

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Paiement manquant</AlertTitle>
      <AlertDescription>
        Aucun paiement enregistré pour le mois en cours.
      </AlertDescription>
    </Alert>
  )
}
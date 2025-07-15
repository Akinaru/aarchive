"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function BlocTjmEstimation() {
  const [tjm, setTjm] = useState(100)
  const [jours, setJours] = useState(0)
  const [, setLoading] = useState(true)

  const fetchTJM = async () => {
    const res = await fetch("/api/monnaie/tjm")
    const data = await res.json()
    setTjm(data.tjm)
  }

  const fetchJours = async () => {
    const res = await fetch("/api/monnaie/jours-travailles")
    const data = await res.json()
    setJours(data.joursTravailles)
  }

  const updateTJM = async () => {
    const res = await fetch("/api/monnaie/tjm", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tjm }),
    })
    if (res.ok) {
      toast.success("TJM mis à jour")
    } else {
      toast.error("Erreur lors de la mise à jour du TJM")
    }
  }

  useEffect(() => {
    Promise.all([fetchTJM(), fetchJours()]).then(() => setLoading(false))
  }, [])

  const estimation = tjm * jours
  const mois = new Date().toLocaleString("fr-FR", { month: "long", year: "numeric" })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestion du TJM</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm">TJM actuel (€ / jour)</label>
          <Input
            type="number"
            value={tjm}
            onChange={(e) => setTjm(parseFloat(e.target.value))}
            className="max-w-xs"
          />
          <Button className="mt-2" onClick={updateTJM}>
            Enregistrer
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          Jours travaillés en {mois} : <strong>{jours}</strong>
        </div>

        <div className="text-base">
          💰 Estimation pour {mois} :{" "}
          <strong>{estimation.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</strong>
        </div>
      </CardContent>
    </Card>
  )
}
"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"

import { Temps } from "@/types/temps"
import { Mission } from "@/types/missions"
import { TypeTache } from "@/types/taches"
import { FormAddTemps } from "@/components/form/form-ajout-temps"

export default function TempsPage() {
  const [temps, setTemps] = useState<Temps[]>([])
  const [missions, setMissions] = useState<Mission[]>([])
  const [types, setTypes] = useState<TypeTache[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [tempsRes, missionRes, typeRes] = await Promise.all([
        fetch("/api/temps"),
        fetch("/api/missions"),
        fetch("/api/type-tache"),
      ])
      setTemps(await tempsRes.json())
      setMissions(await missionRes.json())
      setTypes(await typeRes.json())
    } catch {
      toast.error("Erreur lors du chargement des données")
    } finally {
      setIsLoading(false)
    }
  }

  const deleteTemps = async (id: number) => {
    await fetch(`/api/temps/${id}`, { method: "DELETE" })
    toast.success("Supprimé")
    await fetchData()
  }

  useEffect(() => {
    fetchData()
  }, [])

  const lastTemps = temps.slice().reverse().slice(0, 5)
  const totalMinutes = temps.reduce((sum, t) => sum + t.dureeMinutes, 0)

  const isReady = missions.length > 0 && types.length > 0

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Notation des temps"
        subtitle="Saisissez vos temps de travail quotidiens par mission et type de tâche."
        breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "Temps" }]}
      />

      {!isLoading && !isReady && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Préparation incomplète</AlertTitle>
          <AlertDescription>
            Vous devez d'abord ajouter :
            <ul className="list-disc ml-6 mt-1 space-y-1 text-sm">
              {missions.length === 0 && (
                <li>
                  <Link href="/missions" className="underline hover:opacity-85">au moins une mission</Link>
                </li>
              )}
              {types.length === 0 && (
                <li>
                  <Link href="/type-taches" className="underline hover:opacity-85">au moins un type de tâche</Link>
                </li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && (
        <>
          {/* Formulaire */} 
          <Card>
            <CardHeader>
              <CardTitle>Ajouter un temps</CardTitle>
            </CardHeader>
            <CardContent>
              <FormAddTemps missions={missions} types={types} onAdd={fetchData} />
            </CardContent>
          </Card>

          {/* Historique */} 
          <Card>
            <CardHeader>
              <CardTitle>5 derniers temps saisis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lastTemps.length === 0 ? (
                <p className="text-muted-foreground text-sm">Aucun temps saisi récemment.</p>
              ) : (
                lastTemps.map((t) => {
                  const hasMission = t.mission && t.mission.titre
                  const hasType = t.typeTache && t.typeTache.nom
                  const hasDescription = t.description && t.description.trim() !== ""

                  if (!hasMission || !hasType) return null

                  return (
                    <div key={t.id} className="flex justify-between items-start border rounded-lg p-3">
                      <div>
                        <p className="font-medium">{t.mission.titre} — {t.typeTache.nom}</p>
                        <p className="text-sm text-muted-foreground">
                          {t.dureeMinutes} min — {format(new Date(t.date), "dd/MM/yyyy HH:mm")}
                        </p>
                        {hasDescription && (
                          <p className="text-sm">{t.description}</p>
                        )}
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => deleteTemps(t.id)}>
                        Supprimer
                      </Button>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Statistiques */} 
          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent>
              {totalMinutes === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun temps saisi pour l’instant.</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Total saisi : <span className="font-semibold">{totalMinutes}</span> minutes
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

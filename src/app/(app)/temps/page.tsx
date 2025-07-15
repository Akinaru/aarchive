"use client"

import { useEffect, useState } from "react"
import { format, isToday } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"
import Link from "next/link"
import { Pencil, Trash2, AlertTriangle, Timer, Clock3, ClipboardList, Star } from "lucide-react"

import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

import { Temps } from "@/types/temps"
import { Mission } from "@/types/missions"
import { TypeTache } from "@/types/taches"
import { FormAddTemps } from "@/components/form/form-ajout-temps"
import { FormEditTemps } from "@/components/form/form-edit-temps"

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0) return `${h}h${m > 0 ? `${m}min` : ""}`
  return `${m}min`
}

export default function TempsPage() {
  const [temps, setTemps] = useState<Temps[]>([])
  const [missions, setMissions] = useState<Mission[]>([])
  const [types, setTypes] = useState<TypeTache[]>([])
  const [selectedTemps, setSelectedTemps] = useState<Temps | null>(null)
  const [edited, setEdited] = useState({
    dureeMinutes: 0,
    typeTacheId: "",
    description: "",
  })

  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [tempsRes, missionRes, typeRes] = await Promise.all([
        fetch("/api/temps/recent"),
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

  const updateTemps = async () => {
    if (!selectedTemps) return
    await fetch(`/api/temps/${selectedTemps.id}`, {
      method: "PUT",
      body: JSON.stringify({
        description: edited.description,
        typeTacheId: edited.typeTacheId,
        dureeMinutes: edited.dureeMinutes,
      }),
    })
    toast.success("Temps modifié")
    setSelectedTemps(null)
    await fetchData()
  }

  useEffect(() => {
    fetchData()
  }, [])

  const isReady = missions.length > 0 && types.length > 0
  const lastTemps = temps.slice(0, 5)

  const todayTemps = temps.filter((t) => isToday(new Date(t.date)))
  const totalToday = todayTemps.reduce((sum, t) => sum + t.dureeMinutes, 0)
  const typesToday = todayTemps.map((t) => t.typeTache?.nom).filter(Boolean)
  const mostUsedTypeToday = typesToday.length
    ? typesToday.sort((a, b) =>
        typesToday.filter((v) => v === b).length - typesToday.filter((v) => v === a).length
      )[0]
    : "Aucun"

  const totalMinutes = temps.reduce((sum, t) => sum + t.dureeMinutes, 0)
  const totalMissions = new Set(temps.map((t) => t.mission?.id)).size
  const totalTypes = new Set(temps.map((t) => t.typeTache?.id)).size

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Notation des temps"
        subtitle="Saisissez vos temps de travail quotidiens par mission et type de tâche."
        breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "Temps" }]}
      />

      {/* Statistiques du jour */}
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Temps aujourd’hui</CardTitle>
              <Clock3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatMinutes(totalToday)}</p>
              <p className="text-xs text-muted-foreground">Durée enregistrée</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entrées aujourd’hui</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{todayTemps.length}</p>
              <p className="text-xs text-muted-foreground">temps saisis</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tâche la + utilisée</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-base font-semibold">{mostUsedTypeToday}</p>
              <p className="text-xs text-muted-foreground">aujourd’hui</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total cumulé</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatMinutes(totalMinutes)}</p>
              <p className="text-xs text-muted-foreground">tous temps confondus</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerte si manquant */}
      {!isLoading && !isReady && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Préparation incomplète</AlertTitle>
          <AlertDescription>
            Vous devez au préalable ajouter :
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

      {/* Formulaire ajout */}
      {!isLoading && isReady && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Ajouter un temps</CardTitle>
            </CardHeader>
            <CardContent>
              <FormAddTemps missions={missions} types={types} onAdd={fetchData} />
            </CardContent>
          </Card>

          {/* Derniers temps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">5 derniers temps enregistrés</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lastTemps.map((t) => {
                const createdAtDate = t.createdAt ? new Date(t.createdAt) : null
                const createdAtFormatted =
                  createdAtDate && !isNaN(createdAtDate.getTime())
                    ? format(createdAtDate, "dd/MM/yyyy à HH:mm")
                    : null

                return (
                  <div
                    key={t.id}
                    className="rounded-xl border bg-muted/50 p-4 flex justify-between items-start hover:bg-muted transition"
                  >
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-primary">
                        {t.mission?.titre}
                        <span className="text-muted-foreground font-normal">
                          {" "}— {t.typeTache?.nom}
                        </span>
                      </p>

                      <div className="flex items-center gap-2 text-sm">
                        <span className="inline-block rounded-full bg-primary/10 text-tertiary px-2 py-0.5 text-xs font-semibold">
                          {formatMinutes(t.dureeMinutes)}
                        </span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">
                          {format(new Date(t.date), "EEEE dd MMMM yyyy", { locale: fr })}
                        </span>
                      </div>

                      {t.description && (
                        <p className="text-sm text-foreground">{t.description}</p>
                      )}

                      {createdAtFormatted && (
                        <p className="text-xs text-muted-foreground opacity-50 mt-1">
                          Enregistré le {createdAtFormatted}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          setSelectedTemps(t)
                          setEdited({
                            dureeMinutes: t.dureeMinutes,
                            typeTacheId: t.typeTache?.id.toString() ?? "",
                            description: t.description ?? "",
                          })
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => deleteTemps(t.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Résumé global */}
          <Card>
            <CardHeader>
              <CardTitle>Résumé global</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Temps total saisi</p>
                <p className="text-lg font-bold">{formatMinutes(totalMinutes)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Missions différentes</p>
                <p className="text-lg font-bold">{totalMissions}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Types de tâches</p>
                <p className="text-lg font-bold">{totalTypes}</p>
              </div>
            </CardContent>
          </Card>

          <FormEditTemps
            selectedTemps={selectedTemps}
            types={types}
            edited={edited}
            setEdited={setEdited}
            setSelectedTemps={setSelectedTemps}
            updateTemps={updateTemps}
          />
        </>
      )}
    </div>
  )
} 
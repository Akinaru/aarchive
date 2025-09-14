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
import { Skeleton } from "@/components/ui/skeleton"

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

function toYMD(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10) // YYYY-MM-DD
}

export default function TempsPage() {
  const [temps, setTemps] = useState<Temps[]>([])
  const [missions, setMissions] = useState<Mission[]>([])
  const [types, setTypes] = useState<TypeTache[]>([])
  const [selectedTemps, setSelectedTemps] = useState<Temps | null>(null)
  const [edited, setEdited] = useState({
    date: "",
    dureeMinutes: 0,
    typeTacheId: "",
    description: "",
  })

  const [totalSemaineMinutes, setTotalSemaineMinutes] = useState(0)
  const [totalJourMinutes, setTotalJourMinutes] = useState(0)
  const [objectifMinutes, setObjectifMinutes] = useState(360)
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    try {
      const [tempsRes, missionRes, typeRes] = await Promise.all([
        fetch("/api/temps/recent"),
        fetch("/api/missions"),
        fetch("/api/type-tache"),
      ])

      const tempsData = await tempsRes.json()
      setTemps(tempsData.temps)
      setTotalSemaineMinutes(tempsData.totalSemaineMinutes)
      setTotalJourMinutes(tempsData.totalJourMinutes)
      setObjectifMinutes(tempsData.objectifMinutes)

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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: edited.date,
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
  const typesToday = todayTemps.map((t) => t.typeTache?.nom).filter(Boolean)
  const mostUsedTypeToday = typesToday.length
    ? typesToday.sort((a, b) =>
        typesToday.filter((v) => v === b).length - typesToday.filter((v) => v === a).length
      )[0]
    : "Aucun"

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <PageHeader
          title="Notation des temps"
          subtitle="Saisissez vos temps de travail quotidiens par mission et type de tâche."
          breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "Temps" }]}
        />

        {isLoading ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-4 w-1/3 mb-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-6 w-1/2 mb-1" />
                    <Skeleton className="h-4 w-1/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full rounded-md" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
              </CardHeader>
              <CardContent className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-md" />
                ))}
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Temps aujourd’hui" value={formatMinutes(totalJourMinutes)} icon={<Clock3 className="h-4 w-4 text-muted-foreground" />} subtitle="Durée enregistrée" />
              <StatCard title="Entrées aujourd’hui" value={todayTemps.length.toString()} icon={<ClipboardList className="h-4 w-4 text-muted-foreground" />} subtitle="temps saisis" />
              <StatCard title="Tâche la + utilisée" value={mostUsedTypeToday} icon={<Star className="h-4 w-4 text-muted-foreground" />} subtitle="aujourd’hui" />
              <StatCard title="Total cette semaine" value={formatMinutes(totalSemaineMinutes)} icon={<Timer className="h-4 w-4 text-muted-foreground" />} subtitle="du lundi au dimanche" />
            </div>

            {!isReady && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Préparation incomplète</AlertTitle>
                <AlertDescription>
                  Vous devez au préalable ajouter :
                  <ul className="list-disc ml-6 mt-1 space-y-1 text-sm">
                    {missions.length === 0 && (
                      <li>
                        <Link href="/missions" className="underline hover:opacity-85">
                          au moins une mission
                        </Link>
                      </li>
                    )}
                    {types.length === 0 && (
                      <li>
                        <Link href="/type-taches" className="underline hover:opacity-85">
                          au moins un type de tâche
                        </Link>
                      </li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {isReady && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Ajouter un temps</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormAddTemps missions={missions} types={types} onAdd={fetchData} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">5 derniers temps enregistrés</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {lastTemps.map((t) => {
                      const createdAt = t.createdAt ? new Date(t.createdAt) : null
                      const createdAtFormatted =
                        createdAt && !isNaN(createdAt.getTime())
                          ? format(createdAt, "dd/MM/yyyy à HH:mm")
                          : null

                      return (
                        <div
                          key={t.id}
                          className="rounded-xl border bg-muted/50 p-4 flex flex-col sm:flex-row sm:justify-between gap-2 hover:bg-muted transition"
                        >
                          <div className="space-y-1 flex-1 min-w-0">
                            <p className="text-base font-semibold text-primary break-words">
                              {t.mission?.titre}
                              <span className="text-muted-foreground font-normal">
                                {" "}
                                — {t.typeTache?.nom}
                              </span>
                            </p>

                            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                              <span className="inline-block rounded-full bg-primary/10 text-tertiary px-2 py-0.5 text-xs font-semibold">
                                {formatMinutes(t.dureeMinutes)}
                              </span>
                              <span>·</span>
                              <span>
                                {format(new Date(t.date), "EEEE dd MMMM yyyy", { locale: fr })}
                              </span>
                            </div>

                            {t.description && (
                              <p className="text-sm text-foreground break-words">{t.description}</p>
                            )}

                            {createdAtFormatted && (
                              <p className="text-xs text-muted-foreground opacity-50">
                                Enregistré le {createdAtFormatted}
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2 justify-end sm:items-start">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => {
                                setSelectedTemps(t)
                                setEdited({
                                  date: toYMD(t.date),
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
          </>
        )}
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  subtitle,
}: {
  title: string
  value: string
  icon: React.ReactNode
  subtitle: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  )
}

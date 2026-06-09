// src/app/temps/page.tsx
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { Temps } from "@/types/temps"
import { Mission } from "@/types/missions"
import { TypeTache } from "@/types/taches"
import { FormAddTemps } from "@/components/form/form-ajout-temps"
import { FormEditTemps } from "@/components/form/form-edit-temps"
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0) return `${h}h${m > 0 ? `${m}min` : ""}`
  return `${m}min`
}

function toYMD(value: string | Date) {
  const d = typeof value === "string" ? new Date(value) : value
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

const PAGE_SIZE = 15

function buildPagination(currentPage: number, totalPages: number): Array<number | "..."> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPages]
  }

  if (currentPage >= totalPages - 3) {
    return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }

  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages]
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
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Confirmation suppression
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tempsToDelete, setTempsToDelete] = useState<Temps | null>(null)

  const fetchData = async (page = currentPage) => {
    try {
      const [tempsRes, missionRes, typeRes] = await Promise.all([
        fetch(`/api/temps/recent?page=${page}&limit=${PAGE_SIZE}`),
        fetch("/api/missions"),
        fetch("/api/type-tache"),
      ])

      const tempsData = await tempsRes.json()
      setTemps(tempsData.temps)
      setTotalSemaineMinutes(tempsData.totalSemaineMinutes)
      setTotalJourMinutes(tempsData.totalJourMinutes)
      setCurrentPage(tempsData.pagination?.page ?? 1)
      setTotalPages(tempsData.pagination?.totalPages ?? 1)

      setMissions(await missionRes.json())
      setTypes(await typeRes.json())
    } catch {
      toast.error("Erreur lors du chargement des données")
    } finally {
      setIsLoading(false)
    }
  }

  const confirmDelete = (id: number) => {
    const t = temps.find((x) => x.id === id) || null
    setTempsToDelete(t)
    setDeleteDialogOpen(true)
  }

  const deleteTempsConfirmed = async () => {
    if (!tempsToDelete) return
    try {
      const res = await fetch(`/api/temps/${tempsToDelete.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Supprimé")
      await fetchData()
    } catch {
      toast.error("Erreur lors de la suppression")
    } finally {
      setTempsToDelete(null)
      setDeleteDialogOpen(false)
    }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isReady = missions.length > 0 && types.length > 0

  const todayTemps = temps.filter((t) => isToday(new Date(t.date)))
  const typesToday = todayTemps.map((t) => t.typeTache?.nom).filter(Boolean) as string[]
  const mostUsedTypeToday = typesToday.length
    ? typesToday.sort((a, b) => typesToday.filter((v) => v === b).length - typesToday.filter((v) => v === a).length)[0]
    : "Aucun"

  const paginationItems = buildPagination(currentPage, totalPages)

  const renderPagination = (position: "top" | "bottom") => (
    <div
      className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${
        position === "bottom" ? "border-t pt-4" : ""
      }`}
    >
      <p className="text-sm text-muted-foreground">
        Page {currentPage} sur {totalPages}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchData(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Précédent
        </Button>

        {paginationItems.map((item, index) =>
          item === "..." ? (
            <span key={`${position}-ellipsis-${index}`} className="px-1 text-sm text-muted-foreground">
              ...
            </span>
          ) : (
            <Button
              key={`${position}-page-${item}`}
              variant={item === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => fetchData(item)}
            >
              {item}
            </Button>
          )
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchData(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Suivant
        </Button>
      </div>
    </div>
  )

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
                    <CardTitle className="text-xl">Derniers temps enregistrés</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {renderPagination("top")}

                    {temps.map((t) => {
                      const createdAt = t.createdAt ? new Date(t.createdAt) : null
                      const createdAtFormatted =
                          createdAt && !isNaN(createdAt.getTime())
                              ? format(createdAt, "dd/MM/yyyy à HH:mm")
                              : null

                      const missionTitle = t.mission?.titre ?? "—"
                      const missionInitial = missionTitle[0]?.toUpperCase() ?? "?"

                      return (
                          <div
                              key={t.id}
                              className="rounded-xl border bg-muted/50 p-4 flex flex-col sm:flex-row sm:justify-between gap-3 hover:bg-muted transition"
                          >
                            <div className="flex gap-3 flex-1 min-w-0">
                              <Avatar className="h-10 w-10 border shrink-0">
                                <AvatarImage src={t.mission?.image ?? ""} alt={missionTitle} />
                                <AvatarFallback className="text-sm">{missionInitial}</AvatarFallback>
                              </Avatar>

                              <div className="space-y-1 flex-1 min-w-0">
                                <p className="text-base font-semibold text-primary break-words">
                                  {missionTitle}
                                  <span className="text-muted-foreground font-normal"> — {t.typeTache?.nom}</span>
                                </p>

                                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="inline-block rounded-full bg-primary/10 text-tertiary px-2 py-0.5 text-xs font-semibold">
              {formatMinutes(t.dureeMinutes)}
            </span>
                                  <span>·</span>
                                  <span>{format(new Date(t.date), "EEEE dd MMMM yyyy", { locale: fr })}</span>
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
                                  onClick={() => confirmDelete(t.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                      )
                    })}

                    {renderPagination("bottom")}
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

      {/* Modale de confirmation de suppression */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Supprimer l’entrée{" "}
              <span className="font-semibold">
                {tempsToDelete ? `${tempsToDelete.mission?.titre ?? "—"} — ${formatMinutes(tempsToDelete.dureeMinutes)}` : ""}
              </span>{" "}
              ?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={deleteTempsConfirmed}>
                Supprimer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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

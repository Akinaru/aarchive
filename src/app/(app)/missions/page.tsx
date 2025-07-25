"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, Clock, XCircle } from "lucide-react"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { Mission } from "@/types/missions"
import { Projet } from "@/types/projets"
import { DataTableMissions } from "@/components/table/data-table-missions"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { STATUT_ICONS } from "@/lib/status"
import Link from "next/link"

const STATUTS: (keyof typeof STATUT_ICONS)[] = ["EN_COURS", "TERMINEE", "EN_ATTENTE", "ANNULEE"]

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([])
  const [projets, setProjets] = useState<Projet[]>([])

  const [titre, setTitre] = useState("")
  const [description, setDescription] = useState("")
  const [statut, setStatut] = useState("EN_COURS")
  const [projetId, setProjetId] = useState("")
  const [dateDebut, setDateDebut] = useState("")
  const [dureePrevue, setDureePrevue] = useState("00:00")

  const [editMission, setEditMission] = useState<Mission | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [isLoadingProjets, setIsLoadingProjets] = useState(true)

  const fetchMissions = async () => {
    const res = await fetch("/api/missions")
    const data = await res.json()
    setMissions(data)
  }

  const fetchProjets = async () => {
    setIsLoadingProjets(true)
    const res = await fetch("/api/projets")
    const data = await res.json()
    setProjets(data)
    setIsLoadingProjets(false)
  }

  const addMission = async () => {
    if (!titre.trim() || !projetId) {
      toast.error("Titre et projet requis")
      return
    }

    const [h, m] = dureePrevue.split(":").map(Number)
    const dureePrevueMinutes = h * 60 + m

    try {
      const res = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre,
          description,
          statut,
          projetId: parseInt(projetId),
          dateDebut: dateDebut ? new Date(dateDebut) : null,
          dureePrevueMinutes,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Mission ajoutée")
      setAddDialogOpen(false)
      setTitre("")
      setDescription("")
      setProjetId("")
      setDateDebut("")
      setDureePrevue("00:00")
      await fetchMissions()
    } catch {
      toast.error("Erreur lors de l'ajout.")
    }
  }

  const updateMission = async () => {
    if (!editMission) return

    try {
      const res = await fetch(`/api/missions/${editMission.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre: editMission.titre,
          description: editMission.description,
          statut: editMission.statut,
          projetId: editMission.projetId,
          dateDebut: editMission.dateDebut ? new Date(editMission.dateDebut) : null,
          dureePrevueMinutes: editMission.dureePrevueMinutes ?? 0,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Mission mise à jour")
      setEditMission(null)
      await fetchMissions()
    } catch {
      toast.error("Erreur lors de la modification.")
    }
  }

  const deleteMission = async (id: number) => {
    try {
      const res = await fetch(`/api/missions/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Mission supprimée")
      await fetchMissions()
    } catch {
      toast.error("Erreur lors de la suppression.")
    }
  }

  useEffect(() => {
    fetchMissions()
    fetchProjets()
  }, [])

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <PageHeader
          title="Missions"
          subtitle="Liste des missions par projet."
          breadcrumb={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Missions" },
          ]}
        />

        {!isLoadingProjets && projets.length === 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>Impossible d’ajouter une mission</AlertTitle>
            <AlertDescription>
              <p className="mb-1">Vous devez d’abord créer un projet avant de pouvoir ajouter une mission.</p>
              <ul className="list-inside list-disc text-sm space-y-1">
                <li>
                  <Link href="/projets" className="underline hover:opacity-85">
                    Créer un projet maintenant
                  </Link>
                </li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end">
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={projets.length === 0}>
                Ajouter une mission
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouvelle mission</DialogTitle>
              </DialogHeader>

              {projets.length === 0 ? (
                <div className="rounded-md border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">
                  Aucun projet trouvé. Veuillez{" "}
                  <Link href="/projets" className="underline font-medium text-yellow-900 hover:text-yellow-700">
                    créer un projet
                  </Link>{" "}
                  avant d’ajouter une mission.
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <label htmlFor="titre">Titre</label>
                  <Input
                    placeholder="Titre"
                    value={titre}
                    id="titre"
                    onChange={(e) => setTitre(e.target.value)}
                  />

                  <label htmlFor="description">Description</label>
                  <Textarea
                    placeholder="Description"
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />

                  <label>Projet associé</label>
                  <Select value={projetId} onValueChange={setProjetId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Projet associé"/>
                    </SelectTrigger>
                    <SelectContent>
                      {projets.map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <label htmlFor="dateDebut">Date de début</label>
                  <Input
                    type="date"
                    id="dateDebut"
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                  />

                  <label htmlFor="dureePrevue">Durée prévisionnelle</label>
                  <Input
                    type="time"
                    id="dureePrevue"
                    step="60"
                    value={dureePrevue}
                    onChange={(e) => setDureePrevue(e.target.value)}
                    className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
                  />

                  <label>Status</label>
                  <Select value={statut} onValueChange={setStatut}>
                    <SelectTrigger>
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUTS.map((s) => (
                        <SelectItem key={s} value={s}>
                          <div className="flex items-center gap-2 capitalize">
                            {s === "EN_COURS" && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
                            {s === "TERMINEE" && <CheckCircle className="h-3 w-3 text-green-500" />}
                            {s === "EN_ATTENTE" && <Clock className="h-3 w-3 text-yellow-500" />}
                            {s === "ANNULEE" && <XCircle className="h-3 w-3 text-red-500" />}
                            {s.replace("_", " ").toLowerCase()}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button onClick={addMission}>Créer</Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des missions</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTableMissions
              data={missions}
              onEdit={setEditMission}
              onDelete={deleteMission}
            />
          </CardContent>
        </Card>

        <Dialog open={!!editMission} onOpenChange={(open) => !open && setEditMission(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier la mission</DialogTitle>
            </DialogHeader>
            {editMission && (
              <div className="flex flex-col gap-4">
                <label>Titre</label>
                <Input
                  placeholder="Titre"
                  value={editMission.titre}
                  onChange={(e) =>
                    setEditMission({ ...editMission, titre: e.target.value })
                  }
                />

                <label>Description</label>
                <Textarea
                  placeholder="Description"
                  value={editMission.description ?? ""}
                  onChange={(e) =>
                    setEditMission({ ...editMission, description: e.target.value })
                  }
                />

                <label htmlFor="dateDebut">Date de début</label>
                <Input
                  type="date"
                  id="dateDebut"
                  value={editMission.dateDebut ? new Date(editMission.dateDebut).toISOString().slice(0, 10) : ""}
                  onChange={(e) =>
                    setEditMission({
                      ...editMission,
                      dateDebut: e.target.value ? new Date(e.target.value) : null,
                    })
                  }
                />

                <label htmlFor="dureePrevue">Durée prévisionnelle</label>
                <Input
                  type="time"
                  id="dureePrevue"
                  step="60"
                  value={(() => {
                    const min = editMission.dureePrevueMinutes ?? 0
                    const h = String(Math.floor(min / 60)).padStart(2, "0")
                    const m = String(min % 60).padStart(2, "0")
                    return `${h}:${m}`
                  })()}
                  onChange={(e) => {
                    const [h, m] = e.target.value.split(":").map(Number)
                    setEditMission({
                      ...editMission,
                      dureePrevueMinutes: h * 60 + m,
                    })
                  }}
                  className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
                />

                <label>Status</label>
                <Select
                  value={editMission.statut}
                  onValueChange={(value) =>
                    setEditMission({
                      ...editMission,
                      statut: value as Mission["statut"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUTS.map((s) => {
                      const { icon: Icon, className, spin } = STATUT_ICONS[s]
                      return (
                        <SelectItem key={s} value={s}>
                          <div className="flex items-center gap-2 capitalize">
                            <Icon className={`h-3 w-3 ${className} ${spin ? "animate-spin" : ""}`} />
                            {s.replace("_", " ").toLowerCase()}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>

                <label>Projet associé</label>
                <Select
                  value={editMission.projetId.toString()}
                  onValueChange={(value) =>
                    setEditMission({ ...editMission, projetId: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Projet associé" />
                  </SelectTrigger>
                  <SelectContent>
                    {projets.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button onClick={updateMission}>Mettre à jour</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
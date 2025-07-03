"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, Clock, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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

const STATUTS = ["EN_COURS", "TERMINEE", "EN_ATTENTE", "ANNULEE"]

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([])
  const [projets, setProjets] = useState<Projet[]>([])

  const [titre, setTitre] = useState("")
  const [description, setDescription] = useState("")
  const [prixEstime, setPrixEstime] = useState("")
  const [statut, setStatut] = useState("EN_COURS")
  const [projetId, setProjetId] = useState("")

  const [editMission, setEditMission] = useState<Mission | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const fetchMissions = async () => {
    const res = await fetch("/api/missions")
    const data = await res.json()
    setMissions(data)
  }

  const fetchProjets = async () => {
    const res = await fetch("/api/projets")
    const data = await res.json()
    setProjets(data)
  }

  const addMission = async () => {
    if (!titre.trim() || !projetId) {
      toast.error("Titre et projet requis")
      return
    }

    try {
      const res = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre,
          description,
          statut,
          prixEstime: parseFloat(prixEstime || "0"),
          projetId: parseInt(projetId),
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Mission ajoutée")
      setAddDialogOpen(false)
      setTitre("")
      setDescription("")
      setPrixEstime("")
      setProjetId("")
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
          prixEstime: editMission.prixEstime,
          prixReel: editMission.prixReel,
          projetId: editMission.projetId,
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
    <div className="p-6 mx-auto space-y-6">
      <PageHeader
        title="Missions"
        subtitle="Liste des missions par projet."
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Missions" },
        ]}
      />

      <div className="flex justify-end">
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>Ajouter une mission</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle mission</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <Input
                placeholder="Titre"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
              />
              <Textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Prix estimé (€)"
                value={prixEstime}
                onChange={(e) => setPrixEstime(e.target.value)}
              />
              <Select value={statut} onValueChange={setStatut}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  {STATUTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace("_", " ").toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Badge de statut sélectionné */}
              {statut && (
                <div className="mt-1">
                  <Badge variant="outline" className="flex items-center gap-1 text-sm">
                    {statut === "EN_COURS" && (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin text-blue-500" />
                    )}
                    {statut === "TERMINEE" && (
                      <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
                    )}
                    {statut === "EN_ATTENTE" && (
                      <Clock className="mr-1 h-3 w-3 text-yellow-500" />
                    )}
                    {statut === "ANNULEE" && (
                      <XCircle className="mr-1 h-3 w-3 text-red-500" />
                    )}
                    {statut.replace("_", " ").toLowerCase()}
                  </Badge>
                </div>
              )}

              <Select value={projetId} onValueChange={setProjetId}>
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
              <Button onClick={addMission}>Créer</Button>
            </div>
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
              <Input
                value={editMission.titre}
                onChange={(e) =>
                  setEditMission({ ...editMission, titre: e.target.value })
                }
              />
              <Textarea
                value={editMission.description ?? ""}
                onChange={(e) =>
                  setEditMission({ ...editMission, description: e.target.value })
                }
              />
              <Input
                type="number"
                value={editMission.prixEstime.toString()}
                onChange={(e) =>
                  setEditMission({
                    ...editMission,
                    prixEstime: parseFloat(e.target.value),
                  })
                }
              />
              <Select
                value={editMission.statut}
                onValueChange={(value) =>
                  setEditMission({ ...editMission, statut: value as Mission["statut"] })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  {STATUTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace("_", " ").toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
  )
}

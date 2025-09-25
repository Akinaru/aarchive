// src/app/type-tache/page.tsx
"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { toast } from "sonner"
import { TypeTache } from "@/types/taches"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DataTableTypeTaches } from "@/components/table/data-table-type-taches"

export default function TypeTachePage() {
  const [types, setTypes] = useState<TypeTache[]>([])
  const [newNom, setNewNom] = useState("")
  const [editNom, setEditNom] = useState("")
  const [selectedType, setSelectedType] = useState<TypeTache | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Confirmation de suppression
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [typeToDelete, setTypeToDelete] = useState<TypeTache | null>(null)

  const fetchTypes = async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/type-tache", { cache: "no-store" })
      if (!res.ok) throw new Error("Fetch error")
      const data = await res.json()
      setTypes(data)
    } catch {
      toast.error("Impossible de charger les types")
    } finally {
      setIsLoading(false)
    }
  }

  const addType = async () => {
    if (!newNom.trim()) return toast.error("Nom requis")
    try {
      const res = await fetch("/api/type-tache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: newNom }),
      })
      if (!res.ok) throw new Error()
      setNewNom("")
      toast.success("Type ajouté")
      await fetchTypes()
    } catch {
      toast.error("Erreur lors de l’ajout")
    }
  }

  const updateType = async () => {
    if (!selectedType) return
    if (!editNom.trim()) return toast.error("Nom requis")
    try {
      const res = await fetch(`/api/type-tache/${selectedType.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: editNom }),
      })
      if (!res.ok) throw new Error()
      toast.success("Type modifié")
      setSelectedType(null)
      setEditNom("")
      await fetchTypes()
    } catch {
      toast.error("Erreur lors de la modification")
    }
  }

  // Ouvre la modale de confirmation
  const confirmDelete = (id: number) => {
    const t = types.find((x) => x.id === id) || null
    setTypeToDelete(t)
    setDeleteDialogOpen(true)
  }

  // Supprime après confirmation
  const deleteType = async () => {
    if (!typeToDelete) return
    try {
      const res = await fetch(`/api/type-tache/${typeToDelete.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Supprimé")
      await fetchTypes()
    } catch {
      toast.error("Erreur lors de la suppression")
    } finally {
      setTypeToDelete(null)
      setDeleteDialogOpen(false)
    }
  }

  useEffect(() => {
    fetchTypes()
  }, [])

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <PageHeader
          title="Types de tâche"
          subtitle="Gérez les catégories que vous pouvez assigner à vos temps de travail."
          breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "Types de tâche" }]}
        />

        <Card>
          <CardHeader>
            <CardTitle>Ajouter un type</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              placeholder="Nom du type"
              value={newNom}
              onChange={(e) => setNewNom(e.target.value)}
            />
            <Button onClick={addType}>Ajouter</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Liste des types</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTableTypeTaches
              data={types}
              isLoading={isLoading}
              onEdit={(t) => {
                setSelectedType(t)
                setEditNom(t.nom)
              }}
              onDelete={(id) => confirmDelete(id)}
            />
          </CardContent>
        </Card>

        {/* Édition */}
        <Dialog
          open={!!selectedType}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedType(null)
              setEditNom("")
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier le type</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                value={editNom}
                onChange={(e) => setEditNom(e.target.value)}
                placeholder="Nouveau nom"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedType(null)
                    setEditNom("")
                  }}
                >
                  Annuler
                </Button>
                <Button onClick={updateType}>Valider</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirmation de suppression */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmer la suppression</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>
                Êtes-vous sûr de vouloir supprimer{" "}
                <span className="font-semibold">{typeToDelete?.nom}</span> ?
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Annuler
                </Button>
                <Button variant="destructive" onClick={deleteType}>
                  Supprimer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

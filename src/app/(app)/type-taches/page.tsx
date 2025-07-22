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

export default function TypeTachePage() {
  const [types, setTypes] = useState<TypeTache[]>([])
  const [newNom, setNewNom] = useState("")
  const [editNom, setEditNom] = useState("")
  const [selectedType, setSelectedType] = useState<TypeTache | null>(null)

  const fetchTypes = async () => {
    const res = await fetch("/api/type-tache")
    const data = await res.json()
    setTypes(data)
  }

  const addType = async () => {
    if (!newNom.trim()) return toast.error("Nom requis")

    const res = await fetch("/api/type-tache", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom: newNom }),
    })

    if (res.ok) {
      setNewNom("")
      toast.success("Type ajouté")
      await fetchTypes()
    } else {
      toast.error("Erreur lors de l’ajout")
    }
  }

  const updateType = async () => {
    if (!selectedType) return
    if (!editNom.trim()) return toast.error("Nom requis")

    const res = await fetch(`/api/type-tache/${selectedType.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom: editNom }),
    })

    if (res.ok) {
      toast.success("Type modifié")
      setSelectedType(null)
      setEditNom("")
      await fetchTypes()
    } else {
      toast.error("Erreur lors de la modification")
    }
  }

  const deleteType = async (id: number) => {
    const res = await fetch(`/api/type-tache/${id}`, {
      method: "DELETE",
    })

    if (res.ok) {
      toast.success("Supprimé")
      await fetchTypes()
    } else {
      toast.error("Erreur lors de la suppression")
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
          <CardContent className="space-y-2">
            {types.length === 0 && <p className="text-sm text-muted-foreground">Aucun type encore créé.</p>}

            {types.map((t) => (
              <div key={t.id} className="flex items-center gap-2">
                <span className="flex-1">{t.nom}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedType(t)
                    setEditNom(t.nom)
                  }}
                >
                  Modifier
                </Button>
                <Button variant="destructive" size="sm" onClick={() => deleteType(t.id)}>
                  Supprimer
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

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
              <Button onClick={updateType}>Valider</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
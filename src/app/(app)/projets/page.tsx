"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Projet } from "@/types/projets"
import { Client } from "@/types/clients"
import { DataTableProjets } from "@/components/table/data-table-projets"
import { PageHeader } from "@/components/page-header"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"

export default function ProjetsPage() {
  const [projets, setProjets] = useState<Projet[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientIds, setSelectedClientIds] = useState<number[]>([])
  const [newNom, setNewNom] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [editProjet, setEditProjet] = useState<Projet | null>(null)
  const [editClientIds, setEditClientIds] = useState<number[]>([])
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const isFormValid = () => newNom.trim() !== ""

  const fetchProjets = async () => {
    try {
      const res = await fetch("/api/projets")
      const data = await res.json()
      setProjets(data)
    } catch {
      toast.error("Erreur lors du chargement des projets.")
    }
  }

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients")
      const data = await res.json()
      setClients(data)
    } catch {
      toast.error("Erreur lors du chargement des clients.")
    }
  }

  const toggleClient = (id: number) => {
    setSelectedClientIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const toggleEditClient = (id: number) => {
    setEditClientIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const addProjet = async () => {
    if (!isFormValid()) return

    try {
      const res = await fetch("/api/projets", {
        method: "POST",
        body: JSON.stringify({
          nom: newNom,
          description: newDescription,
          clientIds: selectedClientIds,
        }),
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) throw new Error()
      setNewNom("")
      setNewDescription("")
      setSelectedClientIds([])
      setAddDialogOpen(false)
      await fetchProjets()
      toast.success("Projet ajouté")
    } catch {
      toast.error("Erreur lors de l'ajout du projet.")
    }
  }

  const updateProjet = async () => {
    if (!editProjet) return
    if (!editProjet.nom.trim()) {
      toast.error("Le nom est requis.")
      return
    }

    try {
      const res = await fetch(`/api/projets/${editProjet.id}`, {
        method: "PUT",
        body: JSON.stringify({
          nom: editProjet.nom,
          description: editProjet.description,
          clientIds: editClientIds,
        }),
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) throw new Error()
      setEditProjet(null)
      await fetchProjets()
      toast.success("Projet modifié")
    } catch {
      toast.error("Erreur lors de la modification.")
    }
  }

  const deleteProjet = async (id: number) => {
    try {
      const res = await fetch(`/api/projets/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      await fetchProjets()
      toast.success("Projet supprimé")
    } catch {
      toast.error("Erreur lors de la suppression.")
    }
  }

  useEffect(() => {
    fetchProjets()
    fetchClients()
  }, [])

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <PageHeader
          title="Projets"
          subtitle="Gérez ici la liste de vos projets."
          breadcrumb={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Projets" },
          ]}
        />

        <div className="flex justify-end">
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>Ajouter un projet</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un projet</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <Input
                  placeholder="Nom"
                  value={newNom}
                  onChange={(e) => setNewNom(e.target.value)}
                />
                <Textarea
                  placeholder="Description (optionnel)"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />

                <div className="space-y-1">
                  <Label>Clients associés</Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="justify-start w-full">
                        {selectedClientIds.length > 0
                          ? `${selectedClientIds.length} client(s) sélectionné(s)`
                          : "Sélectionner des clients"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 max-h-64 overflow-auto">
                      {clients.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-muted-foreground">
                          Aucun client à sélectionner
                        </div>
                      ) : (
                        clients.map((client) => (
                          <DropdownMenuCheckboxItem
                            key={client.id}
                            checked={selectedClientIds.includes(client.id)}
                            onCheckedChange={() => toggleClient(client.id)}
                            className="flex items-center gap-2"
                          >
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={client.photoPath || ""} alt={client.nom} />
                              <AvatarFallback>{client.nom[0]}</AvatarFallback>
                            </Avatar>
                            <span>{client.nom}</span>
                          </DropdownMenuCheckboxItem>
                        ))
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {selectedClientIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {clients
                        .filter((c) => selectedClientIds.includes(c.id))
                        .map((client) => (
                          <div
                            key={client.id}
                            className="flex items-center gap-2 text-sm bg-muted px-2 py-1 rounded"
                          >
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={client.photoPath || ""} alt={client.nom} />
                              <AvatarFallback>{client.nom[0]}</AvatarFallback>
                            </Avatar>
                            <span>{client.nom}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <Button onClick={addProjet} disabled={!isFormValid()}>
                  Ajouter
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Liste des projets</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTableProjets
              data={projets}
              onEdit={(projet) => {
                setEditProjet(projet)
                setEditClientIds(projet.clients?.map((c) => c.client.id) || [])
              }}
              onDelete={deleteProjet}
            />
          </CardContent>
        </Card>

        <Dialog open={!!editProjet} onOpenChange={(open) => !open && setEditProjet(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier le projet</DialogTitle>
            </DialogHeader>

            {editProjet && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="nom">Nom du projet</Label>
                  <Input
                    id="nom"
                    placeholder="Nom"
                    value={editProjet.nom}
                    onChange={(e) =>
                      setEditProjet({ ...editProjet, nom: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Description"
                    value={editProjet.description ?? ""}
                    onChange={(e) =>
                      setEditProjet({ ...editProjet, description: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <Label>Clients associés</Label>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="justify-start w-full">
                        {editClientIds.length > 0
                          ? `${editClientIds.length} client(s) sélectionné(s)`
                          : "Sélectionner des clients"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 max-h-64 overflow-auto">
                      {clients.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-muted-foreground">
                          Aucun client à sélectionner
                        </div>
                      ) : (
                        clients.map((client) => (
                          <DropdownMenuCheckboxItem
                            key={client.id}
                            checked={editClientIds.includes(client.id)}
                            onCheckedChange={() => toggleEditClient(client.id)}
                            className="flex items-center gap-2"
                          >
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={client.photoPath || ""} alt={client.nom} />
                              <AvatarFallback>{client.nom[0]}</AvatarFallback>
                            </Avatar>
                            <span>{client.nom}</span>
                          </DropdownMenuCheckboxItem>
                        ))
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {editClientIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {clients
                        .filter((c) => editClientIds.includes(c.id))
                        .map((client) => (
                          <div
                            key={client.id}
                            className="flex items-center gap-2 text-sm bg-muted px-2 py-1 rounded"
                          >
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={client.photoPath || ""} alt={client.nom} />
                              <AvatarFallback>{client.nom[0]}</AvatarFallback>
                            </Avatar>
                            <span>{client.nom}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={updateProjet}>Valider</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

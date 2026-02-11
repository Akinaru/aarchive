"use client"

import { useEffect, useMemo, useState } from "react"
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

type ProjetClientLink = {
  client: Client
  isBilling?: boolean
}

export default function ProjetsPage() {
  const [projets, setProjets] = useState<Projet[]>([])
  const [clients, setClients] = useState<Client[]>([])

  // Add dialog
  const [selectedClientIds, setSelectedClientIds] = useState<number[]>([])
  const [newBillingClientId, setNewBillingClientId] = useState<number | null>(null)
  const [newNom, setNewNom] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  // Edit dialog
  const [editProjet, setEditProjet] = useState<Projet | null>(null)
  const [editClientIds, setEditClientIds] = useState<number[]>([])
  const [editBillingClientId, setEditBillingClientId] = useState<number | null>(null)

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [projetToDelete, setProjetToDelete] = useState<Projet | null>(null)

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

  // ===== Helpers Billing (Add) =====
  const addSelectedClients = useMemo(
      () => clients.filter((c) => selectedClientIds.includes(c.id)),
      [clients, selectedClientIds]
  )

  const ensureAddBilling = (nextIds: number[]) => {
    // si billing actuel n'est plus dedans -> prend le premier
    if (newBillingClientId && nextIds.includes(newBillingClientId)) return
    setNewBillingClientId(nextIds.length ? nextIds[0] : null)
  }

  const toggleClient = (id: number) => {
    setSelectedClientIds((prev) => {
      const next = prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
      // ajuste billing
      queueMicrotask(() => ensureAddBilling(next))
      return next
    })
  }

  // ===== Helpers Billing (Edit) =====
  const editSelectedClients = useMemo(
      () => clients.filter((c) => editClientIds.includes(c.id)),
      [clients, editClientIds]
  )

  const ensureEditBilling = (nextIds: number[]) => {
    if (editBillingClientId && nextIds.includes(editBillingClientId)) return
    setEditBillingClientId(nextIds.length ? nextIds[0] : null)
  }

  const toggleEditClient = (id: number) => {
    setEditClientIds((prev) => {
      const next = prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
      queueMicrotask(() => ensureEditBilling(next))
      return next
    })
  }

  const addProjet = async () => {
    if (!isFormValid()) return

    // si des clients sont sélectionnés, on doit avoir un billing
    if (selectedClientIds.length > 0 && !newBillingClientId) {
      toast.error("Veuillez choisir un client de facturation.")
      return
    }

    try {
      const res = await fetch("/api/projets", {
        method: "POST",
        body: JSON.stringify({
          nom: newNom,
          description: newDescription,
          clientIds: selectedClientIds,
          billingClientId: newBillingClientId, // ✅
        }),
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) throw new Error()

      setNewNom("")
      setNewDescription("")
      setSelectedClientIds([])
      setNewBillingClientId(null)
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

    if (editClientIds.length > 0 && !editBillingClientId) {
      toast.error("Veuillez choisir un client de facturation.")
      return
    }

    try {
      const res = await fetch(`/api/projets/${editProjet.id}`, {
        method: "PUT",
        body: JSON.stringify({
          nom: editProjet.nom,
          description: editProjet.description,
          clientIds: editClientIds,
          billingClientId: editBillingClientId, // ✅
        }),
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) throw new Error()

      setEditProjet(null)
      setEditClientIds([])
      setEditBillingClientId(null)
      await fetchProjets()
      toast.success("Projet modifié")
    } catch {
      toast.error("Erreur lors de la modification.")
    }
  }

  const confirmDelete = (id: number) => {
    const projet = projets.find((p) => p.id === id) || null
    setProjetToDelete(projet)
    setDeleteDialogOpen(true)
  }

  const deleteProjet = async () => {
    if (!projetToDelete) return
    try {
      const res = await fetch(`/api/projets/${projetToDelete.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      await fetchProjets()
      toast.success("Projet supprimé")
    } catch {
      toast.error("Erreur lors de la suppression.")
    } finally {
      setProjetToDelete(null)
      setDeleteDialogOpen(false)
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

                  <div className="space-y-2">
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
                                  <span className="truncate">{client.nom}</span>
                                </DropdownMenuCheckboxItem>
                            ))
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {addSelectedClients.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <div className="text-xs text-muted-foreground">
                            Choisissez le client de facturation (Billing).
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {addSelectedClients.map((client) => {
                              const active = newBillingClientId === client.id
                              return (
                                  <button
                                      key={client.id}
                                      type="button"
                                      onClick={() => setNewBillingClientId(client.id)}
                                      className={[
                                        "flex items-center gap-2 text-sm px-2 py-1 rounded border transition",
                                        active
                                            ? "bg-background border-slate-900/30"
                                            : "bg-muted border-transparent hover:border-slate-900/15",
                                      ].join(" ")}
                                      title="Définir comme client de facturation"
                                  >
                                    <Avatar className="h-5 w-5">
                                      <AvatarImage src={client.photoPath || ""} alt={client.nom} />
                                      <AvatarFallback>{client.nom[0]}</AvatarFallback>
                                    </Avatar>
                                    <span className="truncate max-w-[160px]">{client.nom}</span>
                                    {active && (
                                        <span className="ml-1 text-[10px] rounded bg-slate-900 text-white px-1.5 py-0.5">
                                  Billing
                                </span>
                                    )}
                                  </button>
                              )
                            })}
                          </div>
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

                    const links = (projet.clients || []) as unknown as ProjetClientLink[]
                    const ids = links.map((c) => c.client.id)
                    setEditClientIds(ids)

                    const billing = links.find((c) => c.isBilling)?.client.id ?? null
                    setEditBillingClientId(billing ?? (ids.length ? ids[0] : null))
                  }}
                  onDelete={(id) => confirmDelete(id)}
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
                          onChange={(e) => setEditProjet({ ...editProjet, nom: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                          id="description"
                          placeholder="Description"
                          value={editProjet.description ?? ""}
                          onChange={(e) => setEditProjet({ ...editProjet, description: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
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
                                    <span className="truncate">{client.nom}</span>
                                  </DropdownMenuCheckboxItem>
                              ))
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {editSelectedClients.length > 0 && (
                          <div className="space-y-2 pt-1">
                            <div className="text-xs text-muted-foreground">
                              Choisissez le client de facturation (Billing).
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {editSelectedClients.map((client) => {
                                const active = editBillingClientId === client.id
                                return (
                                    <button
                                        key={client.id}
                                        type="button"
                                        onClick={() => setEditBillingClientId(client.id)}
                                        className={[
                                          "flex items-center gap-2 text-sm px-2 py-1 rounded border transition",
                                          active
                                              ? "bg-background border-slate-900/30"
                                              : "bg-muted border-transparent hover:border-slate-900/15",
                                        ].join(" ")}
                                        title="Définir comme client de facturation"
                                    >
                                      <Avatar className="h-5 w-5">
                                        <AvatarImage src={client.photoPath || ""} alt={client.nom} />
                                        <AvatarFallback>{client.nom[0]}</AvatarFallback>
                                      </Avatar>
                                      <span className="truncate max-w-[160px]">{client.nom}</span>
                                      {active && (
                                          <span className="ml-1 text-[10px] rounded bg-slate-900 text-white px-1.5 py-0.5">
                                  Billing
                                </span>
                                      )}
                                    </button>
                                )
                              })}
                            </div>
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

          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmer la suppression</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p>
                  Êtes-vous sûr de vouloir supprimer{" "}
                  <span className="font-semibold">{projetToDelete?.nom}</span> ?
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button variant="destructive" onClick={deleteProjet}>
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

"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Client } from "@/types/clients"
import { DataTableClients } from "@/components/table/data-table-clients"
import { PageHeader } from "@/components/page-header"

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [newClient, setNewClient] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const isFormValid = () =>
    newClient.trim() !== "" && isValidEmail(newEmail)

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients")
      const data = await res.json()
      setClients(data)
    } catch {
      toast.error("Erreur lors du chargement des clients.")
    }
  }

  const addClient = async () => {
    if (!isFormValid()) return

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        body: JSON.stringify({ nom: newClient, email: newEmail }),
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) throw new Error()
      setNewClient("")
      setNewEmail("")
      setAddDialogOpen(false)
      await fetchClients()
      toast.success("Client ajouté")
    } catch {
      toast.error("Erreur lors de l'ajout du client.")
    }
  }

  const updateClient = async () => {
    if (!editClient) return
    if (!editClient.nom.trim()) {
      toast.error("Le nom est requis.")
      return
    }
    if (!isValidEmail(editClient.email)) {
      toast.error("Adresse email invalide.")
      return
    }

    try {
      const res = await fetch(`/api/clients/${editClient.id}`, {
        method: "PUT",
        body: JSON.stringify({ nom: editClient.nom, email: editClient.email }),
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) throw new Error()
      setEditClient(null)
      await fetchClients()
      toast.success("Client modifié")
    } catch {
      toast.error("Erreur lors de la modification.")
    }
  }

  const deleteClient = async (id: number) => {
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      await fetchClients()
      toast.success("Client supprimé")
    } catch {
      toast.error("Erreur lors de la suppression.")
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  return (
    <div className="p-6 mx-auto space-y-6">
      <PageHeader
        title="Clients"
        subtitle="Gérez ici la liste de vos clients."
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Clients" },
        ]}
      />

      <div className="flex justify-end">
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>Ajouter un client</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter un client</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <Input
                placeholder="Nom"
                value={newClient}
                onChange={(e) => setNewClient(e.target.value)}
              />
              <Input
                placeholder="Email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
              <Button onClick={addClient} disabled={!isFormValid()}>
                Ajouter
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des clients</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTableClients
            data={clients}
            onEdit={(client) => setEditClient(client)}
            onDelete={deleteClient}
          />
        </CardContent>
      </Card>

      <Dialog open={!!editClient} onOpenChange={(open) => !open && setEditClient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le client</DialogTitle>
          </DialogHeader>
          {editClient && (
            <div className="space-y-4">
              <Input
                placeholder="Nom"
                value={editClient.nom}
                onChange={(e) =>
                  setEditClient({ ...editClient, nom: e.target.value })
                }
              />
              <Input
                placeholder="Email"
                value={editClient.email}
                onChange={(e) =>
                  setEditClient({ ...editClient, email: e.target.value })
                }
              />
              <Button onClick={updateClient}>Valider</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

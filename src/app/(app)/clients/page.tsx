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
import { Textarea } from "@/components/ui/textarea"

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])

  // Create
  const [newClient, setNewClient] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newWebsite, setNewWebsite] = useState("")
  const [newPhoto, setNewPhoto] = useState("")

  // New billing fields (align Prisma)
  const [newLegalName, setNewLegalName] = useState("")
  const [newBillingEmail, setNewBillingEmail] = useState("")
  const [newCompanyRegistrationNumber, setNewCompanyRegistrationNumber] = useState("")
  const [newTvaNumber, setNewTvaNumber] = useState("")
  const [newAddressLine1, setNewAddressLine1] = useState("")
  const [newAddressLine2, setNewAddressLine2] = useState("")
  const [newPostalCode, setNewPostalCode] = useState("")
  const [newCity, setNewCity] = useState("")
  const [newState, setNewState] = useState("")
  const [newCountryCode, setNewCountryCode] = useState("")
  const [newBillingNote, setNewBillingNote] = useState("")

  // Edit
  const [editClient, setEditClient] = useState<Client | null>(null)

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isValidEmailOrEmpty = (email: string) => email.trim() === "" || isValidEmail(email)

  // email requis à la création + billingEmail optionnel mais doit être valide si rempli
  const isFormValid = () =>
      newClient.trim() !== "" && isValidEmail(newEmail) && isValidEmailOrEmpty(newBillingEmail)

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients")
      const data = await res.json()
      setClients(data)
    } catch {
      toast.error("Erreur lors du chargement des clients.")
    }
  }

  const resetNewForm = () => {
    setNewClient("")
    setNewEmail("")
    setNewPhone("")
    setNewWebsite("")
    setNewPhoto("")

    setNewLegalName("")
    setNewBillingEmail("")
    setNewCompanyRegistrationNumber("")
    setNewTvaNumber("")
    setNewAddressLine1("")
    setNewAddressLine2("")
    setNewPostalCode("")
    setNewCity("")
    setNewState("")
    setNewCountryCode("")
    setNewBillingNote("")
  }

  const addClient = async () => {
    if (!isFormValid()) return

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        body: JSON.stringify({
          nom: newClient,
          email: newEmail,
          telephone: newPhone || null,
          siteWeb: newWebsite || null,
          photoPath: newPhoto || null,

          // ✅ Prisma fields
          legalName: newLegalName || null,
          billingEmail: newBillingEmail || null,
          companyRegistrationNumber: newCompanyRegistrationNumber || null,
          tvaNumber: newTvaNumber || null,

          addressLine1: newAddressLine1 || null,
          addressLine2: newAddressLine2 || null,
          postalCode: newPostalCode || null,
          city: newCity || null,
          state: newState || null,
          countryCode: newCountryCode || null,

          billingNote: newBillingNote || null,
        }),
        headers: { "Content-Type": "application/json" },
      })

      if (!res.ok) throw new Error()

      resetNewForm()
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

    if (!editClient.email || !isValidEmail(editClient.email)) {
      toast.error("Adresse email invalide.")
      return
    }

    if (editClient.billingEmail && !isValidEmail(editClient.billingEmail)) {
      toast.error("Adresse email de facturation invalide.")
      return
    }

    try {
      const res = await fetch(`/api/clients/${editClient.id}`, {
        method: "PUT",
        body: JSON.stringify({
          nom: editClient.nom,
          email: editClient.email,
          telephone: editClient.telephone,
          siteWeb: editClient.siteWeb,
          photoPath: editClient.photoPath,

          // ✅ Prisma fields
          legalName: editClient.legalName,
          billingEmail: editClient.billingEmail,
          companyRegistrationNumber: editClient.companyRegistrationNumber,
          tvaNumber: editClient.tvaNumber,

          addressLine1: editClient.addressLine1,
          addressLine2: editClient.addressLine2,
          postalCode: editClient.postalCode,
          city: editClient.city,
          state: editClient.state,
          countryCode: editClient.countryCode,

          billingNote: editClient.billingNote,
        }),
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

  const confirmDelete = (id: number) => {
    const client = clients.find((c) => c.id === id) || null
    setClientToDelete(client)
    setDeleteDialogOpen(true)
  }

  const deleteClient = async () => {
    if (!clientToDelete) return
    try {
      const res = await fetch(`/api/clients/${clientToDelete.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      await fetchClients()
      toast.success("Client supprimé")
    } catch {
      toast.error("Erreur lors de la suppression.")
    } finally {
      setClientToDelete(null)
      setDeleteDialogOpen(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  return (
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
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

              <DialogContent className="max-h-[85vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>Ajouter un client</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-6">
                  {/* Identité */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Identité</div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium">Nom (affichage)</label>
                        <Input
                            value={newClient}
                            onChange={(e) => setNewClient(e.target.value)}
                            placeholder="ACME, Jean Dupont…"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Raison sociale (optionnel)</label>
                        <Input
                            value={newLegalName}
                            onChange={(e) => setNewLegalName(e.target.value)}
                            placeholder="ACME SAS (si différent du nom affiché)"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <Input
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder="contact@acme.fr"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Email de facturation (optionnel)</label>
                        <Input
                            value={newBillingEmail}
                            onChange={(e) => setNewBillingEmail(e.target.value)}
                            placeholder="compta@acme.fr (si différent)"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium">Téléphone</label>
                        <Input
                            value={newPhone}
                            onChange={(e) => setNewPhone(e.target.value)}
                            placeholder="+33 6 12 34 56 78"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Site web</label>
                        <Input
                            value={newWebsite}
                            onChange={(e) => setNewWebsite(e.target.value)}
                            placeholder="https://acme.fr"
                        />
                      </div>
                    </div>

                    {/* Photo */}
                    <div className="grid w-full max-w-sm gap-3">
                      <label htmlFor="picture" className="text-sm font-medium">
                        Photo (fichier)
                      </label>
                      <Input
                          id="picture"
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              const reader = new FileReader()
                              reader.onloadend = () => setNewPhoto(reader.result as string)
                              reader.readAsDataURL(file)
                            }
                          }}
                      />
                      {newPhoto && (
                          <img
                              src={newPhoto}
                              alt="Preview"
                              className="h-24 w-24 object-cover rounded border"
                          />
                      )}
                    </div>
                  </div>

                  {/* Adresse */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Adresse de facturation</div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium">Adresse (ligne 1)</label>
                        <Input
                            value={newAddressLine1}
                            onChange={(e) => setNewAddressLine1(e.target.value)}
                            placeholder="10 rue de la Paix"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Adresse (ligne 2)</label>
                        <Input
                            value={newAddressLine2}
                            onChange={(e) => setNewAddressLine2(e.target.value)}
                            placeholder="Bâtiment B, 2e étage (optionnel)"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="text-sm font-medium">Code postal</label>
                        <Input
                            value={newPostalCode}
                            onChange={(e) => setNewPostalCode(e.target.value)}
                            placeholder="75002"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-sm font-medium">Ville</label>
                        <Input
                            value={newCity}
                            onChange={(e) => setNewCity(e.target.value)}
                            placeholder="Paris"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Région/État</label>
                        <Input
                            value={newState}
                            onChange={(e) => setNewState(e.target.value)}
                            placeholder="Île-de-France (optionnel)"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium">Pays (code, ex: FR)</label>
                        <Input
                            value={newCountryCode}
                            onChange={(e) => setNewCountryCode(e.target.value)}
                            placeholder="FR (France), BE, CH…"
                        />
                      </div>
                      <div />
                    </div>
                  </div>

                  {/* Identifiants */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Informations légales</div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium">N° immatriculation (SIREN/SIRET/RCS…)</label>
                        <Input
                            value={newCompanyRegistrationNumber}
                            onChange={(e) => setNewCompanyRegistrationNumber(e.target.value)}
                            placeholder="RCS Paris B 123 456 789 / KB… (selon pays)"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">TVA intracom (optionnel)</label>
                        <Input
                            value={newTvaNumber}
                            onChange={(e) => setNewTvaNumber(e.target.value)}
                            placeholder="FR12345678901"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Notes de facturation (optionnel)</label>
                      <Textarea
                          value={newBillingNote}
                          onChange={(e) => setNewBillingNote(e.target.value)}
                          placeholder='Ex: "PO requis", "Envoyer à compta@...", "Référence commande : ..."\n'
                      />
                    </div>
                  </div>

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
                  onDelete={(id) => confirmDelete(id)}
              />
            </CardContent>
          </Card>

          {/* EDIT */}
          <Dialog open={!!editClient} onOpenChange={(open) => !open && setEditClient(null)}>
            <DialogContent className="max-h-[85vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Modifier le client</DialogTitle>
              </DialogHeader>

              {editClient && (
                  <div className="space-y-6">
                    {/* Identité */}
                    <div className="space-y-3">
                      <div className="text-sm font-medium">Identité</div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium">Nom (affichage)</label>
                          <Input
                              value={editClient.nom}
                              onChange={(e) => setEditClient({ ...editClient, nom: e.target.value })}
                              placeholder="ACME, Jean Dupont…"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Raison sociale</label>
                          <Input
                              value={editClient.legalName ?? ""}
                              onChange={(e) =>
                                  setEditClient({ ...editClient, legalName: e.target.value || null })
                              }
                              placeholder="ACME SAS (si différent)"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium">Email</label>
                          <Input
                              value={editClient.email ?? ""}
                              onChange={(e) => setEditClient({ ...editClient, email: e.target.value })}
                              placeholder="contact@acme.fr"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Email de facturation</label>
                          <Input
                              value={editClient.billingEmail ?? ""}
                              onChange={(e) =>
                                  setEditClient({ ...editClient, billingEmail: e.target.value || null })
                              }
                              placeholder="compta@acme.fr (si différent)"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium">Téléphone</label>
                          <Input
                              value={editClient.telephone ?? ""}
                              onChange={(e) =>
                                  setEditClient({ ...editClient, telephone: e.target.value || null })
                              }
                              placeholder="+33 6 12 34 56 78"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Site web</label>
                          <Input
                              value={editClient.siteWeb ?? ""}
                              onChange={(e) =>
                                  setEditClient({ ...editClient, siteWeb: e.target.value || null })
                              }
                              placeholder="https://acme.fr"
                          />
                        </div>
                      </div>

                      {/* Photo */}
                      <div className="grid w-full max-w-sm gap-3">
                        <label htmlFor="edit-picture" className="text-sm font-medium">
                          Modifier la photo
                        </label>
                        <Input
                            id="edit-picture"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                const reader = new FileReader()
                                reader.onloadend = () => {
                                  setEditClient({ ...editClient, photoPath: reader.result as string })
                                }
                                reader.readAsDataURL(file)
                              }
                            }}
                        />
                        {editClient.photoPath && (
                            <img
                                src={editClient.photoPath}
                                alt="Preview"
                                className="h-24 w-24 object-cover rounded border"
                            />
                        )}
                      </div>
                    </div>

                    {/* Adresse */}
                    <div className="space-y-3">
                      <div className="text-sm font-medium">Adresse de facturation</div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium">Adresse (ligne 1)</label>
                          <Input
                              value={editClient.addressLine1 ?? ""}
                              onChange={(e) =>
                                  setEditClient({ ...editClient, addressLine1: e.target.value || null })
                              }
                              placeholder="10 rue de la Paix"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Adresse (ligne 2)</label>
                          <Input
                              value={editClient.addressLine2 ?? ""}
                              onChange={(e) =>
                                  setEditClient({ ...editClient, addressLine2: e.target.value || null })
                              }
                              placeholder="Bâtiment B, 2e étage (optionnel)"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="text-sm font-medium">Code postal</label>
                          <Input
                              value={editClient.postalCode ?? ""}
                              onChange={(e) =>
                                  setEditClient({ ...editClient, postalCode: e.target.value || null })
                              }
                              placeholder="75002"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-sm font-medium">Ville</label>
                          <Input
                              value={editClient.city ?? ""}
                              onChange={(e) =>
                                  setEditClient({ ...editClient, city: e.target.value || null })
                              }
                              placeholder="Paris"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Région/État</label>
                          <Input
                              value={editClient.state ?? ""}
                              onChange={(e) =>
                                  setEditClient({ ...editClient, state: e.target.value || null })
                              }
                              placeholder="Île-de-France (optionnel)"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium">Pays (code, ex: FR)</label>
                          <Input
                              value={editClient.countryCode ?? ""}
                              onChange={(e) =>
                                  setEditClient({ ...editClient, countryCode: e.target.value || null })
                              }
                              placeholder="FR (France), BE, CH…"
                          />
                        </div>
                        <div />
                      </div>
                    </div>

                    {/* Identifiants */}
                    <div className="space-y-3">
                      <div className="text-sm font-medium">Informations légales</div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium">N° immatriculation</label>
                          <Input
                              value={editClient.companyRegistrationNumber ?? ""}
                              onChange={(e) =>
                                  setEditClient({
                                    ...editClient,
                                    companyRegistrationNumber: e.target.value || null,
                                  })
                              }
                              placeholder="RCS Paris B 123 456 789 / KB…"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">TVA intracom</label>
                          <Input
                              value={editClient.tvaNumber ?? ""}
                              onChange={(e) =>
                                  setEditClient({ ...editClient, tvaNumber: e.target.value || null })
                              }
                              placeholder="FR12345678901"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Notes de facturation</label>
                        <Textarea
                            value={editClient.billingNote ?? ""}
                            onChange={(e) =>
                                setEditClient({ ...editClient, billingNote: e.target.value || null })
                            }
                            placeholder='Ex: "PO requis", "Envoyer à compta@...", "Référence commande : ..."\n'
                        />
                      </div>
                    </div>

                    <Button onClick={updateClient}>Valider</Button>
                  </div>
              )}
            </DialogContent>
          </Dialog>

          {/* DELETE */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmer la suppression</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p>
                  Êtes-vous sûr de vouloir supprimer{" "}
                  <span className="font-semibold">{clientToDelete?.nom}</span> ?
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button variant="destructive" onClick={deleteClient}>
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

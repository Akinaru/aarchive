"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { ChevronDownIcon } from "@radix-ui/react-icons"
import { Payment } from "@/types/monnaie"
import { DataTablePaiements } from "@/components/table/data-table-paiements"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { PageHeader } from "@/components/page-header"
import { BlocTjmEstimation } from "@/components/monnaie/bloc-tjm-estimation"
import { BlocPaiementMensuel } from "@/components/monnaie/bloc-paiement-mensuel"
import { BlocHistoriquePaiements } from "@/components/monnaie/bloc-historique-paiements"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { AlertePaiementManquant } from "@/components/monnaie/bloc-alerte-paiementmanquant"
import { BlocStatsMonetaires } from "@/components/monnaie/bloc-stats-monetaires"
import { ChartBarPaiementsAnnuels } from "@/components/monnaie/bloc-paiements-annuels"

export default function PageMonnaie() {
  const [, setPaiements] = useState<Payment[]>([])
  const [editPayment, setEditPayment] = useState<Payment | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const [date, setDate] = useState<Date | undefined>()
  const [montant, setMontant] = useState("")
  const [dateOpen, setDateOpen] = useState(false)

  const fetchPaiements = async () => {
    try {
      const res = await fetch("/api/monnaie/paiements")
      const json = await res.json()
      setPaiements(json)
    } catch {
      toast.error("Erreur lors du chargement des paiements")
    }
  }

  useEffect(() => {
    fetchPaiements()
  }, [])

  const createPaiement = async () => {
    if (!date || !montant) {
      toast.error("Tous les champs sont requis.")
      return
    }

    try {
      const res = await fetch("/api/monnaie/paiements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mois: date,
          montant: parseFloat(montant),
        }),
      })

      if (!res.ok) throw new Error()
      toast.success("Paiement ajouté")
      setDate(undefined)
      setMontant("")
      setAddDialogOpen(false)
      await fetchPaiements()
    } catch {
      toast.error("Erreur lors de l'ajout")
    }
  }

  const updatePaiement = async () => {
    if (!editPayment) return

    try {
      const res = await fetch(`/api/monnaie/paiements/${editPayment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editPayment),
      })

      if (!res.ok) throw new Error()
      toast.success("Paiement modifié")
      setEditPayment(null)
      await fetchPaiements()
    } catch {
      toast.error("Erreur lors de la modification")
    }
  }

  const deletePaiement = async (id: number) => {
    try {
      const res = await fetch(`/api/monnaie/paiements/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Paiement supprimé")
      await fetchPaiements()
    } catch {
      toast.error("Erreur lors de la suppression")
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <PageHeader
          title="Monnaie"
          subtitle="Suivi des paiements mensuels"
          breadcrumb={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Monnaie" },
          ]}
        />
        <AlertePaiementManquant />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <BlocTjmEstimation />
          <BlocPaiementMensuel />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BlocStatsMonetaires />
          <ChartBarPaiementsAnnuels />
        </div>

        <BlocHistoriquePaiements />

        {/* Bouton ajout paiement */}
        <div className="flex justify-end">
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>Ajouter un paiement</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouveau paiement</DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3">
                  <Label className="px-1">Date de paiement</Label>
                  <Popover open={dateOpen} onOpenChange={setDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-48 justify-between font-normal"
                      >
                        {date
                          ? format(date, "dd MMMM yyyy", { locale: fr })
                          : "Sélectionner une date"}
                        <ChevronDownIcon className="ml-2 h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        captionLayout="dropdown"
                        onSelect={(d) => {
                          setDate(d)
                          setDateOpen(false)
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <label>Montant (€)</label>
                <Input
                  type="number"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                />

                <Button onClick={createPaiement}>Créer</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tableau des paiements */}
        <div>
          <h2 className="text-2xl font-semibold mb-2">Historique détaillé</h2>
          <DataTablePaiements
            onEdit={setEditPayment}
            onDelete={deletePaiement}
          />
        </div>

        {/* Dialog d'édition */}
        <Dialog
          open={!!editPayment}
          onOpenChange={(open) => {
            if (!open) setEditPayment(null)
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier le paiement</DialogTitle>
            </DialogHeader>

            {editPayment && (
              <div className="flex flex-col gap-4">
                {/* Date Picker style popover */}
                <div className="flex flex-col gap-3">
                  <Label className="px-1">Date de paiement</Label>
                  <Popover
                    open={dateOpen}
                    onOpenChange={setDateOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-48 justify-between font-normal"
                      >
                        {editPayment.mois
                          ? format(new Date(editPayment.mois), "dd MMMM yyyy", { locale: fr })
                          : "Sélectionner une date"}
                        <ChevronDownIcon className="ml-2 h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={new Date(editPayment.mois)}
                        captionLayout="dropdown"
                        onSelect={(d) => {
                          if (d) {
                            setEditPayment({
                              ...editPayment,
                              mois: d.toISOString(),
                            })
                            setDateOpen(false)
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Montant */}
                <Label>Montant (€)</Label>
                <Input
                  type="number"
                  value={editPayment.montant}
                  onChange={(e) =>
                    setEditPayment({
                      ...editPayment,
                      montant: parseFloat(e.target.value),
                    })
                  }
                />

                <Button onClick={updatePaiement}>Mettre à jour</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
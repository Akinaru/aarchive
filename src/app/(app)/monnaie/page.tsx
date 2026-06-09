"use client"

import { useEffect, useMemo, useState } from "react"
import { format, startOfQuarter, endOfQuarter } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type ProjetOption = {
  id: number
  nom: string
}

type MoyenPaiementOption = {
  id: number
  nom: string
  type: "CRYPTO" | "BANCAIRE"
  cryptoSymbol?: string | null
  cryptoNetwork?: string | null
  bankIban?: string | null
}

type Encaissement = {
  id: number
  projetId: number
  moyenPaiementId: number | null
  datePaiement: string
  moisReference: number | null
  anneeReference: number | null
  montantRecu: number
  description: string | null
  createdAt: string
  updatedAt: string
  projet: {
    id: number
    nom: string
  }
  moyenPaiement: {
    id: number
    nom: string
    type: "CRYPTO" | "BANCAIRE"
    cryptoSymbol?: string | null
    cryptoNetwork?: string | null
    bankIban?: string | null
  } | null
}

type EncaissementFormState = {
  projetId: string
  moyenPaiementId: string
  datePaiement: string
  moisReference: string
  anneeReference: string
  montantRecu: string
  description: string
}

type CycleDeclaration = {
  id: number
  annee: number
  trimestre: number
  debutSaisie: string
  finSaisie: string
  createdAt: string
  updatedAt: string
}

type CycleFormState = {
  annee: string
  trimestre: string
  debutSaisie: string
  finSaisie: string
}

function toDateInput(date: Date) {
  return format(date, "yyyy-MM-dd")
}

function toDateTimeLocalInput(date: Date) {
  return format(date, "yyyy-MM-dd'T'HH:mm")
}

function formatCurrency(amount: number) {
  return amount.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function emptyForm(projectId = ""): EncaissementFormState {
  const today = new Date()
  return {
    projetId: projectId,
    moyenPaiementId: "",
    datePaiement: toDateInput(new Date()),
    moisReference: String(today.getMonth() + 1),
    anneeReference: String(today.getFullYear()),
    montantRecu: "",
    description: "",
  }
}

function emptyCycleForm(): CycleFormState {
  const year = new Date().getFullYear()
  const quarterStart = startOfQuarter(new Date())
  const quarterEnd = endOfQuarter(new Date())
  const end = new Date(quarterEnd)
  end.setHours(23, 59, 0, 0)

  return {
    annee: String(year),
    trimestre: String(Math.floor(quarterStart.getMonth() / 3) + 1),
    debutSaisie: toDateTimeLocalInput(quarterStart),
    finSaisie: toDateTimeLocalInput(end),
  }
}

const MONTH_OPTIONS = [
  { value: "1", label: "Janvier" },
  { value: "2", label: "Février" },
  { value: "3", label: "Mars" },
  { value: "4", label: "Avril" },
  { value: "5", label: "Mai" },
  { value: "6", label: "Juin" },
  { value: "7", label: "Juillet" },
  { value: "8", label: "Août" },
  { value: "9", label: "Septembre" },
  { value: "10", label: "Octobre" },
  { value: "11", label: "Novembre" },
  { value: "12", label: "Décembre" },
]

function formatMoyenPaiementLabel(
  moyen: { nom: string; type: "CRYPTO" | "BANCAIRE"; cryptoSymbol?: string | null; cryptoNetwork?: string | null }
) {
  if (moyen.type === "CRYPTO") {
    if (moyen.cryptoSymbol && moyen.cryptoNetwork) {
      return `${moyen.nom} (${moyen.cryptoSymbol} - ${moyen.cryptoNetwork})`
    }
    if (moyen.cryptoSymbol) {
      return `${moyen.nom} (${moyen.cryptoSymbol})`
    }
    return `${moyen.nom} (Crypto)`
  }
  return `${moyen.nom} (Bancaire)`
}

function formatReferenceMonth(month: number | null, year: number | null, fallbackDate: string) {
  if (month && year) {
    return `${String(month).padStart(2, "0")}/${year}`
  }

  const date = new Date(fallbackDate)
  const m = date.getMonth() + 1
  const y = date.getFullYear()
  return `${String(m).padStart(2, "0")}/${y}`
}

function formatCycleLabel(cycle: Pick<CycleDeclaration, "trimestre" | "annee">) {
  return `${cycle.trimestre}ème Trim ${cycle.annee}`
}

function getQuarterDeclarationRange(annee: number, trimestre: number) {
  const startMonth = (trimestre - 1) * 3
  const periodStart = new Date(annee, startMonth, 1, 0, 0, 0, 0)
  const periodEnd = new Date(annee, startMonth + 3, 0, 23, 59, 59, 999)
  return { periodStart, periodEnd }
}

function getCycleStatus(cycle: CycleDeclaration) {
  const now = new Date()
  const start = new Date(cycle.debutSaisie)
  const end = new Date(cycle.finSaisie)

  if (now < start) return "A venir"
  if (now > end) return "Cloture"
  return "Ouvert"
}

function getDeclarationAmountHint(moyenPaiement?: MoyenPaiementOption | null) {
  if (moyenPaiement?.type === "CRYPTO") {
    return "Dans ton cas Ledger -> Revolut -> compte pro, saisis la valeur en euros du paiement au moment de la réception sur Ledger."
  }

  return "Saisis le montant réellement encaissé pour ce paiement."
}

export default function PageMonnaie() {
  const [projets, setProjets] = useState<ProjetOption[]>([])
  const [moyensPaiement, setMoyensPaiement] = useState<MoyenPaiementOption[]>([])
  const [cycles, setCycles] = useState<CycleDeclaration[]>([])
  const [encaissements, setEncaissements] = useState<Encaissement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [createForm, setCreateForm] = useState<EncaissementFormState>(emptyForm())

  const [editTarget, setEditTarget] = useState<Encaissement | null>(null)
  const [editForm, setEditForm] = useState<EncaissementFormState>(emptyForm())

  const [isCycleAddOpen, setIsCycleAddOpen] = useState(false)
  const [cycleCreateForm, setCycleCreateForm] = useState<CycleFormState>(emptyCycleForm())
  const [cycleEditTarget, setCycleEditTarget] = useState<CycleDeclaration | null>(null)
  const [cycleEditForm, setCycleEditForm] = useState<CycleFormState>(emptyCycleForm())

  const loadProjets = async () => {
    const res = await fetch("/api/projets")
    if (!res.ok) throw new Error("Erreur chargement projets")
    const json = (await res.json()) as Array<{ id: number; nom: string }>
    setProjets(
      json
        .map((item) => ({
          id: item.id,
          nom: item.nom,
        }))
        .sort((a, b) => a.nom.localeCompare(b.nom))
    )
  }

  const loadMoyensPaiement = async () => {
    const res = await fetch("/api/moyens-paiement")
    if (!res.ok) throw new Error("Erreur chargement moyens de paiement")

    const json = (await res.json()) as MoyenPaiementOption[]
    setMoyensPaiement(json)
  }

  const loadEncaissements = async () => {
    const res = await fetch("/api/monnaie/encaissements")
    if (!res.ok) throw new Error("Erreur chargement encaissements")

    const json = (await res.json()) as Encaissement[]
    setEncaissements(json)
  }

  const loadCycles = async () => {
    const res = await fetch("/api/monnaie/cycles")
    if (!res.ok) throw new Error("Erreur chargement cycles")

    const json = (await res.json()) as CycleDeclaration[]
    setCycles(json)
  }

  const refresh = async () => {
    try {
      setIsLoading(true)
      await Promise.all([loadProjets(), loadMoyensPaiement(), loadEncaissements(), loadCycles()])
    } catch {
      toast.error("Impossible de charger les données monétaires.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (projets.length === 0) return
    if (!createForm.projetId) {
      setCreateForm((prev) => ({ ...prev, projetId: String(projets[0].id) }))
    }
  }, [projets, createForm.projetId])

  useEffect(() => {
    const moyens = moyensPaiement
    setCreateForm((prev) => {
      const stillValid = moyens.some((m) => String(m.id) === prev.moyenPaiementId)
      if (stillValid) return prev
      return {
        ...prev,
        moyenPaiementId: moyens[0] ? String(moyens[0].id) : "",
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moyensPaiement])

  useEffect(() => {
    if (!editTarget) return
    const moyens = moyensPaiement
    setEditForm((prev) => {
      const stillValid = moyens.some((m) => String(m.id) === prev.moyenPaiementId)
      if (stillValid) return prev
      return {
        ...prev,
        moyenPaiementId: moyens[0] ? String(moyens[0].id) : "",
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editTarget, moyensPaiement])

  const totalGlobal = useMemo(
    () => encaissements.reduce((sum, row) => sum + Number(row.montantRecu || 0), 0),
    [encaissements]
  )

  const selectedCreateMoyen = useMemo(
    () => moyensPaiement.find((item) => String(item.id) === createForm.moyenPaiementId) ?? null,
    [moyensPaiement, createForm.moyenPaiementId]
  )

  const selectedEditMoyen = useMemo(
    () => moyensPaiement.find((item) => String(item.id) === editForm.moyenPaiementId) ?? null,
    [moyensPaiement, editForm.moyenPaiementId]
  )

  const cycleSummaries = useMemo(() => {
    return cycles.map((cycle) => {
      const { periodStart, periodEnd } = getQuarterDeclarationRange(cycle.annee, cycle.trimestre)
      const items = encaissements.filter((item) => {
        const current = new Date(item.datePaiement)
        return current >= periodStart && current <= periodEnd
      })

      const montant = items.reduce((sum, row) => sum + Number(row.montantRecu || 0), 0)

      return {
        cycle,
        periodStart,
        periodEnd,
        count: items.length,
        montant,
      }
    })
  }, [cycles, encaissements])

  useEffect(() => {
    if (cycles.length === 0) {
      setSelectedCycleId(null)
      return
    }

    if (selectedCycleId && cycles.some((cycle) => cycle.id === selectedCycleId)) {
      return
    }

    const now = new Date()
    const openCycle = cycles.find((cycle) => now >= new Date(cycle.debutSaisie) && now <= new Date(cycle.finSaisie))
    if (openCycle) {
      setSelectedCycleId(openCycle.id)
      return
    }

    const latest = cycles
      .slice()
      .sort((a, b) => (a.annee === b.annee ? a.trimestre - b.trimestre : a.annee - b.annee))
      .at(-1)

    setSelectedCycleId(latest ? latest.id : cycles[0].id)
  }, [cycles, selectedCycleId])

  const activeCycleSummary =
    cycleSummaries.find((entry) => entry.cycle.id === selectedCycleId) ?? null

  const activeCycleCount = activeCycleSummary?.count ?? 0
  const activeCycleMontant = activeCycleSummary?.montant ?? 0
  const activeCycleOutside = Math.max(0, totalGlobal - activeCycleMontant)

  const isInActiveCycle = (isoDate: string) => {
    if (!activeCycleSummary) return false
    const current = new Date(isoDate)
    return current >= activeCycleSummary.periodStart && current <= activeCycleSummary.periodEnd
  }

  const submitCycleCreate = async () => {
    const annee = Number.parseInt(cycleCreateForm.annee, 10)
    const trimestre = Number.parseInt(cycleCreateForm.trimestre, 10)
    const debutSaisieDate = new Date(cycleCreateForm.debutSaisie)
    const finSaisieDate = new Date(cycleCreateForm.finSaisie)

    if (
      !Number.isInteger(annee) ||
      annee < 2000 ||
      annee > 2200 ||
      !Number.isInteger(trimestre) ||
      trimestre < 1 ||
      trimestre > 4 ||
      Number.isNaN(debutSaisieDate.getTime()) ||
      Number.isNaN(finSaisieDate.getTime())
    ) {
      toast.error("Cycle invalide: vérifie année, trimestre et dates de saisie.")
      return
    }

    try {
      const res = await fetch("/api/monnaie/cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          annee,
          trimestre,
          debutSaisie: debutSaisieDate.toISOString(),
          finSaisie: finSaisieDate.toISOString(),
        }),
      })

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error || "Erreur lors de la création du cycle")
      }

      toast.success("Cycle de déclaration ajouté.")
      setIsCycleAddOpen(false)
      setCycleCreateForm(emptyCycleForm())
      await loadCycles()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur lors de la création du cycle"
      toast.error(message)
    }
  }

  const seedCycles2026 = async () => {
    const presets = [
      { annee: 2026, trimestre: 1, debutSaisie: "2026-04-01T00:00:00", finSaisie: "2026-07-31T23:59:00" },
      { annee: 2026, trimestre: 2, debutSaisie: "2026-07-01T00:00:00", finSaisie: "2026-07-31T23:59:00" },
      { annee: 2026, trimestre: 3, debutSaisie: "2026-10-01T00:00:00", finSaisie: "2026-11-02T23:59:00" },
      { annee: 2026, trimestre: 4, debutSaisie: "2027-01-01T00:00:00", finSaisie: "2027-02-01T23:59:00" },
    ]

    let created = 0
    let skipped = 0

    for (const cycle of presets) {
      // eslint-disable-next-line no-await-in-loop
      const res = await fetch("/api/monnaie/cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cycle),
      })

      if (res.ok) {
        created += 1
        continue
      }

      if (res.status === 409) {
        skipped += 1
        continue
      }
    }

    await loadCycles()
    toast.success(`Cycles 2026: ${created} ajouté(s), ${skipped} déjà présent(s).`)
  }

  const openCycleEdit = (cycle: CycleDeclaration) => {
    setCycleEditTarget(cycle)
    setCycleEditForm({
      annee: String(cycle.annee),
      trimestre: String(cycle.trimestre),
      debutSaisie: toDateTimeLocalInput(new Date(cycle.debutSaisie)),
      finSaisie: toDateTimeLocalInput(new Date(cycle.finSaisie)),
    })
  }

  const submitCycleEdit = async () => {
    if (!cycleEditTarget) return

    const annee = Number.parseInt(cycleEditForm.annee, 10)
    const trimestre = Number.parseInt(cycleEditForm.trimestre, 10)
    const debutSaisieDate = new Date(cycleEditForm.debutSaisie)
    const finSaisieDate = new Date(cycleEditForm.finSaisie)

    if (
      !Number.isInteger(annee) ||
      annee < 2000 ||
      annee > 2200 ||
      !Number.isInteger(trimestre) ||
      trimestre < 1 ||
      trimestre > 4 ||
      Number.isNaN(debutSaisieDate.getTime()) ||
      Number.isNaN(finSaisieDate.getTime())
    ) {
      toast.error("Cycle invalide: vérifie année, trimestre et dates de saisie.")
      return
    }

    try {
      const res = await fetch(`/api/monnaie/cycles/${cycleEditTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          annee,
          trimestre,
          debutSaisie: debutSaisieDate.toISOString(),
          finSaisie: finSaisieDate.toISOString(),
        }),
      })

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error || "Erreur lors de la modification du cycle")
      }

      toast.success("Cycle de déclaration mis à jour.")
      setCycleEditTarget(null)
      await loadCycles()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur lors de la modification du cycle"
      toast.error(message)
    }
  }

  const deleteCycle = async (id: number) => {
    const ok = window.confirm("Supprimer ce cycle de déclaration ?")
    if (!ok) return

    try {
      const res = await fetch(`/api/monnaie/cycles/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Cycle supprimé.")
      await loadCycles()
    } catch {
      toast.error("Erreur lors de la suppression du cycle.")
    }
  }

  const activateCycle = (cycleId: number) => {
    setSelectedCycleId(cycleId)
  }

  const parseAmount = (raw: string) => Number.parseFloat(raw.replace(",", "."))

  const submitCreate = async () => {
    const projetId = Number.parseInt(createForm.projetId, 10)
    const moisReference = Number.parseInt(createForm.moisReference, 10)
    const anneeReference = Number.parseInt(createForm.anneeReference, 10)
    const moyenPaiementId = createForm.moyenPaiementId
      ? Number.parseInt(createForm.moyenPaiementId, 10)
      : null
    const montant = parseAmount(createForm.montantRecu)
    if (
      !projetId ||
      !createForm.datePaiement ||
      !Number.isInteger(moisReference) ||
      moisReference < 1 ||
      moisReference > 12 ||
      !Number.isInteger(anneeReference) ||
      anneeReference < 1900 ||
      !Number.isFinite(montant) ||
      montant <= 0
    ) {
      toast.error("Projet, date, mois/année concernés et montant valide sont requis.")
      return
    }

    try {
      const res = await fetch("/api/monnaie/encaissements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projetId,
          datePaiement: createForm.datePaiement,
          moisReference,
          anneeReference,
          moyenPaiementId,
          montantRecu: montant,
          description: createForm.description,
        }),
      })

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error || "Erreur lors de la création")
      }

      toast.success("Encaissement enregistré.")
      setCreateForm(emptyForm(createForm.projetId))
      setIsAddOpen(false)
      await loadEncaissements()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur lors de la création"
      toast.error(message)
    }
  }

  const openEdit = (encaissement: Encaissement) => {
    const fallbackDate = new Date(encaissement.datePaiement)
    setEditTarget(encaissement)
    setEditForm({
      projetId: String(encaissement.projetId),
      moyenPaiementId: encaissement.moyenPaiementId ? String(encaissement.moyenPaiementId) : "",
      datePaiement: format(new Date(encaissement.datePaiement), "yyyy-MM-dd"),
      moisReference: String(encaissement.moisReference ?? fallbackDate.getMonth() + 1),
      anneeReference: String(encaissement.anneeReference ?? fallbackDate.getFullYear()),
      montantRecu: String(encaissement.montantRecu),
      description: encaissement.description ?? "",
    })
  }

  const submitEdit = async () => {
    if (!editTarget) return

    const projetId = Number.parseInt(editForm.projetId, 10)
    const moisReference = Number.parseInt(editForm.moisReference, 10)
    const anneeReference = Number.parseInt(editForm.anneeReference, 10)
    const moyenPaiementId = editForm.moyenPaiementId
      ? Number.parseInt(editForm.moyenPaiementId, 10)
      : null
    const montant = parseAmount(editForm.montantRecu)

    if (
      !projetId ||
      !editForm.datePaiement ||
      !Number.isInteger(moisReference) ||
      moisReference < 1 ||
      moisReference > 12 ||
      !Number.isInteger(anneeReference) ||
      anneeReference < 1900 ||
      !Number.isFinite(montant) ||
      montant <= 0
    ) {
      toast.error("Projet, date, mois/année concernés et montant valide sont requis.")
      return
    }

    try {
      const res = await fetch(`/api/monnaie/encaissements/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projetId,
          datePaiement: editForm.datePaiement,
          moisReference,
          anneeReference,
          moyenPaiementId,
          montantRecu: montant,
          description: editForm.description,
        }),
      })

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error || "Erreur lors de la modification")
      }

      toast.success("Encaissement mis à jour.")
      setEditTarget(null)
      await loadEncaissements()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur lors de la modification"
      toast.error(message)
    }
  }

  const removeEncaissement = async (id: number) => {
    const ok = window.confirm("Supprimer cet encaissement ?")
    if (!ok) return

    try {
      const res = await fetch(`/api/monnaie/encaissements/${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error()
      toast.success("Encaissement supprimé.")
      await loadEncaissements()
    } catch {
      toast.error("Erreur lors de la suppression.")
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Gestion monétaire"
        subtitle="Encaissements par projet et calcul de déclaration trimestrielle."
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Monnaie" },
        ]}
      />

      <Card>
        <CardHeader className="gap-4">
          <CardTitle>Périodes de déclaration (selon cycles)</CardTitle>
          <p className="text-sm text-muted-foreground">
            Le calcul est fait automatiquement à partir des cycles que tu définis.
          </p>
        </CardHeader>
        <CardContent>
          {cycleSummaries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun cycle défini pour le moment. Ajoute un cycle dans la section en bas pour lancer le calcul.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Cycle actif</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xl font-semibold">
                      {activeCycleSummary ? formatCycleLabel(activeCycleSummary.cycle) : "Aucun"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activeCycleSummary
                        ? `${format(activeCycleSummary.periodStart, "dd/MM/yyyy")} → ${format(activeCycleSummary.periodEnd, "dd/MM/yyyy")}`
                        : "Sélectionne un cycle"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Montant à déclarer (cycle actif)</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-2xl font-semibold">{formatCurrency(activeCycleMontant)}</p>
                    <p className="text-xs text-muted-foreground">{activeCycleCount} paiement(s) dans le cycle</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Hors cycle actif</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-2xl font-semibold">{formatCurrency(activeCycleOutside)}</p>
                    <p className="text-xs text-muted-foreground">Encaissements non inclus dans ce cycle</p>
                  </CardContent>
                </Card>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cycle</TableHead>
                      <TableHead>Période à déclarer</TableHead>
                      <TableHead>Fenêtre de saisie</TableHead>
                      <TableHead className="text-right">Paiements</TableHead>
                      <TableHead className="text-right">Montant à déclarer</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cycleSummaries.map((entry) => {
                      const isActive = entry.cycle.id === selectedCycleId
                      return (
                        <TableRow key={entry.cycle.id} className={isActive ? "bg-primary/5" : ""}>
                          <TableCell className="font-medium">{formatCycleLabel(entry.cycle)}</TableCell>
                          <TableCell>
                            {format(entry.periodStart, "dd/MM/yyyy")} → {format(entry.periodEnd, "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell>
                            {format(new Date(entry.cycle.debutSaisie), "dd/MM/yyyy HH:mm")} →{" "}
                            {format(new Date(entry.cycle.finSaisie), "dd/MM/yyyy HH:mm")}
                          </TableCell>
                          <TableCell className="text-right">{entry.count}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(entry.montant)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              size="sm"
                              variant={isActive ? "default" : "outline"}
                              onClick={() => activateCycle(entry.cycle.id)}
                            >
                              {isActive ? "Actif" : "Activer"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="order-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Cycles de déclaration URSSAF</CardTitle>
            <p className="text-sm text-muted-foreground">
              Définis les fenêtres de saisie officielles par trimestre.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={seedCycles2026}>
              Préremplir 2026
            </Button>
            <Dialog open={isCycleAddOpen} onOpenChange={setIsCycleAddOpen}>
              <DialogTrigger asChild>
                <Button>Ajouter un cycle</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouveau cycle</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Année</Label>
                      <Input
                        type="number"
                        min={2000}
                        max={2200}
                        value={cycleCreateForm.annee}
                        onChange={(e) => setCycleCreateForm((prev) => ({ ...prev, annee: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Trimestre</Label>
                      <Select
                        value={cycleCreateForm.trimestre}
                        onValueChange={(value) => setCycleCreateForm((prev) => ({ ...prev, trimestre: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir un trimestre" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1er trimestre</SelectItem>
                          <SelectItem value="2">2ème trimestre</SelectItem>
                          <SelectItem value="3">3ème trimestre</SelectItem>
                          <SelectItem value="4">4ème trimestre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Début de saisie</Label>
                    <Input
                      type="datetime-local"
                      value={cycleCreateForm.debutSaisie}
                      onChange={(e) => setCycleCreateForm((prev) => ({ ...prev, debutSaisie: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Fin de saisie</Label>
                    <Input
                      type="datetime-local"
                      value={cycleCreateForm.finSaisie}
                      onChange={(e) => setCycleCreateForm((prev) => ({ ...prev, finSaisie: e.target.value }))}
                    />
                  </div>

                  <Button onClick={submitCycleCreate} className="w-full">
                    Enregistrer le cycle
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trimestre</TableHead>
                  <TableHead>Début saisie</TableHead>
                  <TableHead>Fin saisie</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cycles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-20 text-center">
                      Aucun cycle défini.
                    </TableCell>
                  </TableRow>
                ) : (
                  cycles.map((cycle) => {
                    const status = getCycleStatus(cycle)

                    return (
                      <TableRow key={cycle.id}>
                        <TableCell className="font-medium">{formatCycleLabel(cycle)}</TableCell>
                        <TableCell>{format(new Date(cycle.debutSaisie), "dd/MM/yyyy HH:mm")}</TableCell>
                        <TableCell>{format(new Date(cycle.finSaisie), "dd/MM/yyyy HH:mm")}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              status === "Ouvert"
                                ? "default"
                                : status === "A venir"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => activateCycle(cycle.id)}>
                              Utiliser
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openCycleEdit(cycle)}>
                              Modifier
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => deleteCycle(cycle.id)}>
                              Supprimer
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="order-1">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Encaissements</CardTitle>
            <p className="text-sm text-muted-foreground">
              Total enregistré: {formatCurrency(totalGlobal)}
            </p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>Ajouter un paiement</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nouveau paiement reçu</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Projet</Label>
                  <Select
                    value={createForm.projetId}
                    onValueChange={(value) => setCreateForm((prev) => ({ ...prev, projetId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un projet" />
                    </SelectTrigger>
                    <SelectContent>
                      {projets.map((projet) => (
                        <SelectItem key={projet.id} value={String(projet.id)}>
                          {projet.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Moyen de paiement utilisé</Label>
                  <Select
                    value={createForm.moyenPaiementId}
                    onValueChange={(value) => setCreateForm((prev) => ({ ...prev, moyenPaiementId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un moyen de paiement" />
                    </SelectTrigger>
                    <SelectContent>
                      {moyensPaiement.length === 0 ? (
                        <SelectItem value="none" disabled>
                          Aucun moyen de paiement disponible
                        </SelectItem>
                      ) : (
                        moyensPaiement.map((moyen) => (
                          <SelectItem key={moyen.id} value={String(moyen.id)}>
                            {formatMoyenPaiementLabel(moyen)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date de paiement</Label>
                  <Input
                    type="date"
                    value={createForm.datePaiement}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, datePaiement: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Mois concerné</Label>
                    <Select
                      value={createForm.moisReference}
                      onValueChange={(value) => setCreateForm((prev) => ({ ...prev, moisReference: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Mois concerné" />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTH_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Année concernée</Label>
                    <Input
                      type="number"
                      min={1900}
                      max={2200}
                      value={createForm.anneeReference}
                      onChange={(e) => setCreateForm((prev) => ({ ...prev, anneeReference: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Montant reçu (€)</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={createForm.montantRecu}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, montantRecu: e.target.value }))}
                    placeholder="Ex: 1250.00"
                  />
                  <p className="text-xs text-muted-foreground">
                    {getDeclarationAmountHint(selectedCreateMoyen)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Ex: Acompte sprint 2, facture INV-2026-042"
                  />
                </div>

                <Button onClick={submitCreate} className="w-full">
                  Enregistrer
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Mois/Année concerné</TableHead>
                  <TableHead>Projet</TableHead>
                  <TableHead>Moyen</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Déclaration</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : encaissements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      Aucun paiement enregistré.
                    </TableCell>
                  </TableRow>
                ) : (
                  encaissements.map((item) => {
                    const inPeriod = isInActiveCycle(item.datePaiement)

                    return (
                      <TableRow key={item.id}>
                        <TableCell>{format(new Date(item.datePaiement), "dd/MM/yyyy")}</TableCell>
                        <TableCell>{formatReferenceMonth(item.moisReference, item.anneeReference, item.datePaiement)}</TableCell>
                        <TableCell>{item.projet.nom}</TableCell>
                        <TableCell className="max-w-[260px] truncate">
                          {item.moyenPaiement ? formatMoyenPaiementLabel(item.moyenPaiement) : "—"}
                        </TableCell>
                        <TableCell className="max-w-[420px] truncate">
                          {item.description?.trim() || "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.montantRecu)}
                        </TableCell>
                        <TableCell>
                          {activeCycleSummary ? (
                            <Badge variant={inPeriod ? "default" : "secondary"}>
                              {inPeriod ? "A déclarer" : "Hors cycle actif"}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Aucun cycle actif</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                              Modifier
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => removeEncaissement(item.id)}>
                              Supprimer
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 space-y-4">
            <Card>
              <CardHeader className="gap-4">
                <CardTitle>Quel montant ajouter en paiement ?</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Pour ton cas crypto, on retient le montant en euros au moment de la réception sur Ledger. Les transferts vers Revolut et la conversion en EUR ne doivent pas créer un nouveau paiement.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Étape</TableHead>
                        <TableHead>Détail</TableHead>
                        <TableHead className="text-right">Valeur</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">1. Facture envoyée</TableCell>
                        <TableCell>Montant demandé au client</TableCell>
                        <TableCell className="text-right">70,00 €</TableCell>
                      </TableRow>
                      <TableRow className="bg-primary/5">
                        <TableCell className="font-medium">2. Paiement reçu sur Ledger</TableCell>
                        <TableCell>80,0407 USDT (ETH) - montant à déclarer</TableCell>
                        <TableCell className="text-right font-semibold text-primary">69,43 €</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">3. Transfert vers Revolut</TableCell>
                        <TableCell>80,0407 USDT (ETH)</TableCell>
                        <TableCell className="text-right">68,44 €</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">4. Conversion en EUR</TableCell>
                        <TableCell>Conversion sur Revolut</TableCell>
                        <TableCell className="text-right">68,40 €</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(editTarget)} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le paiement</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Projet</Label>
              <Select value={editForm.projetId} onValueChange={(value) => setEditForm((prev) => ({ ...prev, projetId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un projet" />
                </SelectTrigger>
                <SelectContent>
                  {projets.map((projet) => (
                    <SelectItem key={projet.id} value={String(projet.id)}>
                      {projet.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Moyen de paiement utilisé</Label>
              <Select
                value={editForm.moyenPaiementId}
                onValueChange={(value) => setEditForm((prev) => ({ ...prev, moyenPaiementId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un moyen de paiement" />
                </SelectTrigger>
                <SelectContent>
                  {moyensPaiement.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Aucun moyen de paiement disponible
                    </SelectItem>
                  ) : (
                    moyensPaiement.map((moyen) => (
                      <SelectItem key={moyen.id} value={String(moyen.id)}>
                        {formatMoyenPaiementLabel(moyen)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date de paiement</Label>
              <Input
                type="date"
                value={editForm.datePaiement}
                onChange={(e) => setEditForm((prev) => ({ ...prev, datePaiement: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Mois concerné</Label>
                <Select
                  value={editForm.moisReference}
                  onValueChange={(value) => setEditForm((prev) => ({ ...prev, moisReference: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Mois concerné" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTH_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Année concernée</Label>
                <Input
                  type="number"
                  min={1900}
                  max={2200}
                  value={editForm.anneeReference}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, anneeReference: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Montant reçu (€)</Label>
              <Input
                type="text"
                inputMode="decimal"
                value={editForm.montantRecu}
                onChange={(e) => setEditForm((prev) => ({ ...prev, montantRecu: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                {getDeclarationAmountHint(selectedEditMoyen)}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <Button onClick={submitEdit} className="w-full">
              Mettre à jour
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(cycleEditTarget)} onOpenChange={(open) => !open && setCycleEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le cycle</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Année</Label>
                <Input
                  type="number"
                  min={2000}
                  max={2200}
                  value={cycleEditForm.annee}
                  onChange={(e) => setCycleEditForm((prev) => ({ ...prev, annee: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Trimestre</Label>
                <Select
                  value={cycleEditForm.trimestre}
                  onValueChange={(value) => setCycleEditForm((prev) => ({ ...prev, trimestre: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un trimestre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1er trimestre</SelectItem>
                    <SelectItem value="2">2ème trimestre</SelectItem>
                    <SelectItem value="3">3ème trimestre</SelectItem>
                    <SelectItem value="4">4ème trimestre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Début de saisie</Label>
              <Input
                type="datetime-local"
                value={cycleEditForm.debutSaisie}
                onChange={(e) => setCycleEditForm((prev) => ({ ...prev, debutSaisie: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Fin de saisie</Label>
              <Input
                type="datetime-local"
                value={cycleEditForm.finSaisie}
                onChange={(e) => setCycleEditForm((prev) => ({ ...prev, finSaisie: e.target.value }))}
              />
            </div>

            <Button onClick={submitCycleEdit} className="w-full">
              Mettre à jour le cycle
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"
import { Download, FolderDown, Loader2 } from "lucide-react"
import { zipSync } from "fflate"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { formatMinutes } from "@/lib/time"
import {
  buildMonthlyInvoicePdf,
  downloadMonthlyInvoice,
  fileSafeMissionName,
  getMissionPaymentMethods,
  invoiceFileName,
  type InvoiceMonthData,
} from "@/lib/invoice-download"
import type { Mission } from "@/types/missions"

type FactureMois = {
  missionId: number
  annee: number
  mois: number
  totalMinutes: number
  nbTaches: number
  montant: number
}

function formatCurrency(amount: number) {
  return amount.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function factureKey(f: FactureMois) {
  return `${f.missionId}-${f.annee}-${f.mois}`
}

export default function FacturesPage() {
  const [factures, setFactures] = useState<FactureMois[]>([])
  const [missions, setMissions] = useState<Mission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [missionFilter, setMissionFilter] = useState("all")
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null)
  const [zipProgress, setZipProgress] = useState<{ done: number; total: number } | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [resFactures, resMissions] = await Promise.all([fetch("/api/factures"), fetch("/api/missions")])
        if (!resFactures.ok || !resMissions.ok) throw new Error()
        setFactures((await resFactures.json()) as FactureMois[])
        setMissions((await resMissions.json()) as Mission[])
      } catch {
        toast.error("Impossible de charger les factures.")
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const missionById = useMemo(() => new Map(missions.map((m) => [m.id, m])), [missions])

  const missionsWithFactures = useMemo(() => {
    const ids = new Set(factures.map((f) => f.missionId))
    return missions.filter((m) => ids.has(m.id)).sort((a, b) => a.titre.localeCompare(b.titre))
  }, [factures, missions])

  const filteredFactures = useMemo(
    () => (missionFilter === "all" ? factures : factures.filter((f) => String(f.missionId) === missionFilter)),
    [factures, missionFilter]
  )

  // Factures groupées par année (la plus récente d'abord), déjà triées par mois décroissant côté API.
  const byYear = useMemo(() => {
    const groups = new Map<number, FactureMois[]>()
    for (const f of filteredFactures) {
      const list = groups.get(f.annee) ?? []
      list.push(f)
      groups.set(f.annee, list)
    }
    return Array.from(groups.entries()).sort((a, b) => b[0] - a[0])
  }, [filteredFactures])

  const fileNameOf = (facture: FactureMois) =>
    invoiceFileName(missionById.get(facture.missionId)?.titre ?? `mission-${facture.missionId}`, facture.annee, facture.mois)

  const fetchMonthData = async (facture: FactureMois) => {
    // Milieu de mois : évite tout décalage de fuseau entre navigateur et serveur.
    const date = new Date(facture.annee, facture.mois - 1, 15, 12)
    const params = new URLSearchParams({ date: date.toISOString(), missionId: String(facture.missionId) })
    const res = await fetch(`/api/temps/mois?${params.toString()}`)
    if (!res.ok) throw new Error()
    return (await res.json()) as InvoiceMonthData
  }

  const download = async (facture: FactureMois) => {
    const key = factureKey(facture)
    setDownloadingKey(key)
    try {
      const data = await fetchMonthData(facture)
      await downloadMonthlyInvoice(data, getMissionPaymentMethods(missionById.get(facture.missionId)), fileNameOf(facture))
    } catch {
      toast.error("Erreur lors de la génération de la facture.")
    } finally {
      setDownloadingKey(null)
    }
  }

  const downloadAll = async () => {
    const items = filteredFactures
    if (items.length === 0) return
    setZipProgress({ done: 0, total: items.length })
    try {
      const files: Record<string, Uint8Array> = {}
      for (const facture of items) {
        // Séquentiel : évite de saturer l'API et garde des numéros de facture distincts.
        const data = await fetchMonthData(facture)
        const doc = await buildMonthlyInvoicePdf(data, getMissionPaymentMethods(missionById.get(facture.missionId)))
        files[fileNameOf(facture)] = new Uint8Array(doc.output("arraybuffer"))
        setZipProgress((prev) => (prev ? { ...prev, done: prev.done + 1 } : prev))
      }

      const zip = zipSync(files, { level: 0 }) // PDF déjà compressés
      const mission = missionFilter === "all" ? null : missionById.get(Number(missionFilter))
      const zipName = mission ? `${fileSafeMissionName(mission.titre)}_factures.zip` : "factures.zip"

      const url = URL.createObjectURL(new Blob([zip], { type: "application/zip" }))
      const link = document.createElement("a")
      link.href = url
      link.download = zipName
      link.click()
      URL.revokeObjectURL(url)
      toast.success(`${items.length} facture(s) téléchargée(s).`)
    } catch {
      toast.error("Erreur lors de la génération des factures.")
    } finally {
      setZipProgress(null)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Factures"
        subtitle="Toutes les factures mensuelles disponibles, par mission."
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Factures" },
        ]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Select value={missionFilter} onValueChange={setMissionFilter}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Toutes les missions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les missions</SelectItem>
            {missionsWithFactures.map((m) => (
              <SelectItem key={m.id} value={String(m.id)}>
                {m.titre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={downloadAll} disabled={filteredFactures.length === 0 || zipProgress !== null || downloadingKey !== null}>
          {zipProgress ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <FolderDown className="w-4 h-4 mr-2" />
          )}
          {zipProgress
            ? `Génération ${zipProgress.done}/${zipProgress.total}…`
            : `Tout télécharger (${filteredFactures.length})`}
        </Button>
        <p className="text-sm text-muted-foreground">
          Une facture apparaît dès qu'un mois contient au moins une tâche sur une mission avec TJM.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : byYear.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucune facture disponible.</p>
      ) : (
        byYear.map(([annee, items]) => {
          const totalAnnee = items.reduce((sum, f) => sum + f.montant, 0)
          return (
            <Card key={annee}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{annee}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {items.length} facture(s) · {formatCurrency(totalAnnee)}
                </p>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Mois</TableHead>
                        <TableHead>Mission</TableHead>
                        <TableHead>Projet</TableHead>
                        <TableHead className="text-right">Temps</TableHead>
                        <TableHead className="text-right">Tâches</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                        <TableHead className="text-right">Facture</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((f) => {
                        const mission = missionById.get(f.missionId)
                        const key = factureKey(f)
                        return (
                          <TableRow key={key}>
                            <TableCell className="font-medium capitalize">
                              {format(new Date(f.annee, f.mois - 1, 1), "MMMM", { locale: fr })}
                            </TableCell>
                            <TableCell>{mission?.titre ?? `Mission #${f.missionId}`}</TableCell>
                            <TableCell className="text-muted-foreground">{mission?.projet?.nom ?? "—"}</TableCell>
                            <TableCell className="text-right">{formatMinutes(f.totalMinutes)}</TableCell>
                            <TableCell className="text-right">{f.nbTaches}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(f.montant)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={downloadingKey !== null || zipProgress !== null}
                                onClick={() => download(f)}
                              >
                                {downloadingKey === key ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Download className="w-4 h-4 mr-2" />
                                )}
                                PDF
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}

// src/lib/invoice-download.ts
import { parseISO } from "date-fns"
import { generateMonthlyTempsPDF, type InvoicePaymentMethod } from "@/lib/exportpdf-month"
import type { Mission } from "@/types/missions"

/** Forme minimale renvoyée par /api/temps/mois nécessaire à la facture. */
export type InvoiceTempsItem = {
  date: string
  createdAt: string
  updatedAt?: string
  mission: { id: number; image: string | null }
}

export type InvoiceMonthData<T extends InvoiceTempsItem = InvoiceTempsItem> = {
  monthStart: string
  monthEnd: string
  weeks: { weekStart: string; weekEnd: string; temps: T[] }[]
}

function isDataUrl(s: string) {
  return s.startsWith("data:image/")
}

async function urlToDataUrl(url: string): Promise<string | null> {
  try {
    const absolute = url.startsWith("http") ? url : new URL(url, window.location.origin).toString()
    const res = await fetch(absolute)
    if (!res.ok) return null

    const blob = await res.blob()
    return await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(String(reader.result))
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export function getMissionPaymentMethods(mission?: Mission | null): InvoicePaymentMethod[] {
  return (mission?.projet?.moyensPaiement ?? []).map((link) => ({
    id: link.moyenPaiement.id,
    nom: link.moyenPaiement.nom,
    type: link.moyenPaiement.type,
    cryptoSymbol: link.moyenPaiement.cryptoSymbol ?? null,
    cryptoNetwork: link.moyenPaiement.cryptoNetwork ?? null,
    bankAccountHolder: link.moyenPaiement.bankAccountHolder ?? null,
    bankIban: link.moyenPaiement.bankIban ?? null,
  }))
}

/** Titre de mission utilisable dans un nom de fichier. */
export function fileSafeMissionName(missionTitre: string) {
  return missionTitre.trim().replace(/[^\p{L}\p{N}-]+/gu, "-").replace(/^-+|-+$/g, "") || "mission"
}

/** Nom de fichier d'une facture : MISSION_ANNEE_MOIS.pdf (ex. KGYTB_2025_11.pdf). */
export function invoiceFileName(missionTitre: string, annee: number, mois: number) {
  return `${fileSafeMissionName(missionTitre)}_${annee}_${String(mois).padStart(2, "0")}.pdf`
}

/** Construit la facture PDF d'un mois à partir de la réponse /api/temps/mois. */
export async function buildMonthlyInvoicePdf(data: InvoiceMonthData, paymentMethods: InvoicePaymentMethod[]) {
  const imageByMissionId = new Map<number, string>()
  const uniqueMissions = new Map<number, string>()

  for (const t of data.weeks.flatMap((w) => w.temps)) {
    const img = t.mission?.image
    if (!img) continue
    if (!uniqueMissions.has(t.mission.id)) uniqueMissions.set(t.mission.id, img)
  }

  await Promise.all(
    Array.from(uniqueMissions.entries()).map(async ([missionId, img]) => {
      if (isDataUrl(img)) {
        imageByMissionId.set(missionId, img)
        return
      }
      const dataUrl = await urlToDataUrl(img)
      if (dataUrl) imageByMissionId.set(missionId, dataUrl)
    })
  )

  const weeksForPdf = data.weeks.map((w) => ({
    weekStart: parseISO(w.weekStart),
    weekEnd: parseISO(w.weekEnd),
    temps: w.temps.map((t) => ({
      ...t,
      mission: {
        ...t.mission,
        image: imageByMissionId.get(t.mission.id) ?? null,
      },
      date: new Date(t.date),
      createdAt: new Date(t.createdAt),
      updatedAt: t.updatedAt ? new Date(t.updatedAt) : undefined,
    })),
  }))

  type WeeklyGroupsParam = Parameters<typeof generateMonthlyTempsPDF>[2]
  const weeks = weeksForPdf as unknown as WeeklyGroupsParam

  return generateMonthlyTempsPDF(parseISO(data.monthStart), parseISO(data.monthEnd), weeks, paymentMethods)
}

export async function downloadMonthlyInvoice(
  data: InvoiceMonthData,
  paymentMethods: InvoicePaymentMethod[],
  fileName: string
) {
  const doc = await buildMonthlyInvoicePdf(data, paymentMethods)
  doc.save(fileName)
}

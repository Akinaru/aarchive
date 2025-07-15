import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

function getFirstDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function getMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

async function getJoursTravaillesParMois(start: Date, end: Date) {
  const jours = await prisma.temps.findMany({
    where: {
      date: {
        gte: start,
        lte: end,
      },
    },
    select: { date: true },
  })

  const parMois = new Map<string, Set<string>>()

  for (const { date } of jours) {
    const d = new Date(date)
    const key = getMonthKey(d)
    const dayStr = d.toISOString().split("T")[0]

    if (!parMois.has(key)) parMois.set(key, new Set())
    parMois.get(key)?.add(dayStr)
  }

  return parMois
}

export async function GET() {
  try {
    const paiements = await prisma.paiementMensuel.findMany({
      orderBy: { mois: "asc" },
    })

    const tjm = (await prisma.parametre.findUnique({ where: { id: "tjm" } }))?.value ?? 100

    const moisDebut = paiements.length
      ? new Date(paiements[0].mois)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const moisFin = new Date()
    const moisKeys: string[] = []

    for (
      let d = getFirstDay(moisDebut);
      d <= moisFin;
      d.setMonth(d.getMonth() + 1)
    ) {
      moisKeys.push(getMonthKey(new Date(d)))
    }

    const joursTravailles = await getJoursTravaillesParMois(moisDebut, moisFin)

    const paiementsMap = new Map<string, { id: number; montant: number; mois: string }>()
    paiements.forEach((p) => {
      const key = getMonthKey(new Date(p.mois))
      paiementsMap.set(key, {
        id: p.id,
        montant: p.montant,
        mois: p.mois.toString(),
      })
    })

    const result = moisKeys.map((key) => {
      const paiement = paiementsMap.get(key)
      const jours = joursTravailles.get(key)?.size ?? 0
      const estimation = jours * tjm

      return {
        id: paiement?.id ?? null,
        mois: `${key}-01`,
        montant: paiement?.montant ?? 0,
        estimation,
        jours,
        paye: !!paiement,
      }
    })

    const totalMontant = result.reduce((acc, p) => acc + p.montant, 0)
    const totalEstimation = result.reduce((acc, p) => acc + p.estimation, 0)

    const last6 = result.slice(-6)
    const totalPaye6 = last6.reduce((acc, p) => acc + p.montant, 0)
    const totalEstime6 = last6.reduce((acc, p) => acc + p.estimation, 0)
    const variationMoy = result.length
      ? result.reduce((acc, p) => acc + ((p.montant - p.estimation) / p.estimation) * 100, 0) / result.length
      : 0

    const moisManquants = result.filter((r) => !r.paye).map((r) => r.mois)

    return NextResponse.json({
      paiements: result,
      stats: {
        tjm,
        totalMontant,
        totalEstimation,
        totalPaye6,
        totalEstime6,
        variationMoy,
        moisManquants,
      },
    })
  } catch (error) {
    console.error("Erreur API paiements :", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
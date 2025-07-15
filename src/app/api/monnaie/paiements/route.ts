import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

// Helper pour compter les jours travaillés dans un mois donné
async function getJoursTravaillesPourMois(annee: number, mois: number) {
  const debut = new Date(annee, mois, 1)
  const fin = new Date(annee, mois + 1, 0)

  const jours = await prisma.temps.findMany({
    where: {
      date: {
        gte: debut,
        lte: fin,
      },
    },
    select: { date: true },
  })

  const uniques = new Set(jours.map(j => j.date.toISOString().split("T")[0]))
  return uniques.size
}

export async function GET() {
  try {
    const paiements = await prisma.paiementMensuel.findMany({
      orderBy: { mois: "asc" },
      select: {
        id: true,
        mois: true,
        montant: true,
      },
    })

    const param = await prisma.parametre.findUnique({ where: { id: "tjm" } })
    const tjm = param?.value ?? 100

    const paiementsAvecEstimation = await Promise.all(
      paiements.map(async (paiement) => {
        const date = new Date(paiement.mois)
        const jours = await getJoursTravaillesPourMois(date.getFullYear(), date.getMonth())
        const estimation = jours * tjm

        return {
          ...paiement,
          estimation,
        }
      })
    )

    return NextResponse.json(paiementsAvecEstimation)
  } catch (error) {
    console.error("Erreur GET paiements :", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const body = await req.json()
  const { mois, montant } = body

  if (!mois || isNaN(parseFloat(montant))) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 })
  }

  const date = new Date(new Date(mois).getFullYear(), new Date(mois).getMonth(), 1, 12)
  const year = date.getFullYear()
  const month = date.getMonth()

  const premierJour = new Date(year, month, 1)
  const dernierJour = new Date(year, month + 1, 0)

  const existing = await prisma.paiementMensuel.findFirst({
    where: {
      mois: {
        gte: premierJour,
        lte: dernierJour,
      },
    },
  })

  if (existing) {
    return NextResponse.json(
      { error: "Un paiement est déjà enregistré pour ce mois." },
      { status: 409 }
    )
  }

  const paiement = await prisma.paiementMensuel.create({
    data: {
      mois: date,
      montant: parseFloat(montant),
    },
  })

  return NextResponse.json(paiement)
}
// src/app/api/factures/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type FactureMois = {
  missionId: number
  annee: number
  mois: number // 1-12
  totalMinutes: number
  nbTaches: number
  montant: number
}

/**
 * Liste les factures disponibles : un mois par mission dès qu'il existe au moins
 * une tâche ce mois-là et que la mission a un TJM renseigné.
 */
export async function GET() {
  try {
    const temps = await prisma.temps.findMany({
      where: { mission: { tjm: { gt: 0 } } },
      select: {
        date: true,
        dureeMinutes: true,
        mission: { select: { id: true, tjm: true } },
      },
    })

    const byKey = new Map<string, FactureMois>()

    for (const t of temps) {
      const date = new Date(t.date)
      const annee = date.getFullYear()
      const mois = date.getMonth() + 1
      const key = `${t.mission.id}-${annee}-${mois}`

      let entry = byKey.get(key)
      if (!entry) {
        entry = { missionId: t.mission.id, annee, mois, totalMinutes: 0, nbTaches: 0, montant: 0 }
        byKey.set(key, entry)
      }

      entry.totalMinutes += t.dureeMinutes
      entry.nbTaches += 1
      // Même règle que /api/temps/mois : TJM pour 450 minutes (7h30).
      entry.montant += ((t.mission.tjm ?? 0) / 450) * t.dureeMinutes
    }

    const factures = Array.from(byKey.values()).sort((a, b) =>
      a.annee !== b.annee ? b.annee - a.annee : a.mois !== b.mois ? b.mois - a.mois : a.missionId - b.missionId
    )

    return NextResponse.json(factures)
  } catch (error) {
    console.error("Erreur GET /api/factures :", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { startOfWeek, endOfWeek } from "date-fns"
import { prisma } from "@/lib/prisma"

type JourMission = {
  missionId: number
  missionTitre: string
  tjm: number | null
  requiredDailyMinutes: number | null
  minutes: number
  amount: number
}

type Jour = {
  date: string // ISO (yyyy-mm-dd)
  missions: JourMission[]
  totals: {
    minutes: number
    amount: number
  }
}

export async function GET() {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 })
  const end = endOfWeek(new Date(), { weekStartsOn: 1 })

  const rows = await prisma.temps.findMany({
    where: { date: { gte: start, lte: end } },
    select: {
      date: true,
      dureeMinutes: true,
      mission: {
        select: {
          id: true,
          titre: true,
          tjm: true,
          requiredDailyMinutes: true,
        },
      },
    },
    orderBy: { date: "asc" },
  })

  // Regroupement jour -> mission
  const map = new Map<string, Map<number, JourMission>>()

  for (const r of rows) {
    const d = new Date(r.date)
    const dayKey = d.toISOString().slice(0, 10) // yyyy-mm-dd
    const m = r.mission
    const missionId = m?.id ?? -1
    const missionTitre = m?.titre ?? "Sans mission"
    const tjm = m?.tjm ?? null
    const req = m?.requiredDailyMinutes ?? null

    if (!map.has(dayKey)) map.set(dayKey, new Map())
    const missionsMap = map.get(dayKey)!

    if (!missionsMap.has(missionId)) {
      missionsMap.set(missionId, {
        missionId,
        missionTitre,
        tjm,
        requiredDailyMinutes: req,
        minutes: 0,
        amount: 0,
      })
    }

    const jm = missionsMap.get(missionId)!
    jm.minutes += r.dureeMinutes ?? 0
  }

  // Calcul montant
  const days: Jour[] = []
  for (const [dayKey, missionsMap] of map.entries()) {
    let totalMinutes = 0
    let totalAmount = 0

    const missions: JourMission[] = Array.from(missionsMap.values()).map((jm) => {
      const baseline = jm.requiredDailyMinutes && jm.requiredDailyMinutes > 0 ? jm.requiredDailyMinutes : 450
      const tjm = jm.tjm ?? 0
      const amount = (jm.minutes / baseline) * tjm
      totalMinutes += jm.minutes
      totalAmount += amount
      return { ...jm, amount: Number(amount.toFixed(2)) }
    })

    // Tri par montant desc
    missions.sort((a, b) => b.amount - a.amount)

    days.push({
      date: dayKey,
      missions,
      totals: {
        minutes: totalMinutes,
        amount: Number(totalAmount.toFixed(2)),
      },
    })
  }

  // Compléter les jours vides de la semaine (0 si aucun temps)
  // (optionnel; décommenter si tu veux toujours 7 entrées)
  /*
  const cursor = new Date(start)
  while (cursor <= end) {
    const dayKey = cursor.toISOString().slice(0, 10)
    if (!map.has(dayKey)) {
      days.push({
        date: dayKey,
        missions: [],
        totals: { minutes: 0, amount: 0 },
      })
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  */

  // Tri par date asc
  days.sort((a, b) => a.date.localeCompare(b.date))

  return NextResponse.json({ start, end, days })
}

import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { toZonedTime, format as tzFormat } from "date-fns-tz"
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  subMonths,
} from "date-fns"

export async function GET() {
  const timeZone = "Europe/Paris"
  const now = new Date()
  const zonedNow = toZonedTime(now, timeZone)

  const todayStart = startOfDay(zonedNow)
  const todayEnd = endOfDay(zonedNow)
  const monthStart = startOfMonth(zonedNow)
  const monthEnd = endOfMonth(zonedNow)

  const prevMonthEnd = endOfMonth(subMonths(zonedNow, 1))
  const prevMonthStart = startOfMonth(subMonths(zonedNow, 1))

  // ✅ Temps aujourd’hui
  const tempsAujourdHui = await prisma.temps.aggregate({
    where: { date: { gte: todayStart, lte: todayEnd } },
    _sum: { dureeMinutes: true },
  })

  // ✅ Temps du mois (pour jours uniques + moyenne)
  const tempsMois = await prisma.temps.findMany({
    where: { date: { gte: monthStart, lte: monthEnd } },
    select: { date: true, dureeMinutes: true },
  })

  const dateKey = (d: Date) =>
    tzFormat(toZonedTime(d, timeZone), "yyyy-MM-dd", { timeZone })

  const uniqueJours = new Set(tempsMois.map((j) => dateKey(j.date)))
  const totalMinutesMois = tempsMois.reduce((sum, t) => sum + t.dureeMinutes, 0)
  const nbJours = uniqueJours.size
  const moyenneMinutesParJour = nbJours > 0 ? Math.round(totalMinutesMois / nbJours) : 0

  // ✅ TJM depuis Parametre
  const paramTjm = await prisma.parametre.findUnique({ where: { id: "tjm" } })
  const TJM = paramTjm ? Number(paramTjm.value) : 100

  // ✅ Estimation salaire (conservée même si on n’affiche plus dans la 4e carte)
  const estimationSalaire = nbJours * TJM

  // ✅ Mission populaire
  // 1) Ce mois
  const topThisMonth = await prisma.temps.groupBy({
    by: ["missionId"],
    where: { date: { gte: monthStart, lte: monthEnd } },
    _sum: { dureeMinutes: true },
    orderBy: { _sum: { dureeMinutes: "desc" } },
    take: 1,
  })

  // 2) Mois dernier (fallback)
  const topPrevMonth = topThisMonth.length === 0
    ? await prisma.temps.groupBy({
        by: ["missionId"],
        where: { date: { gte: prevMonthStart, lte: prevMonthEnd } },
        _sum: { dureeMinutes: true },
        orderBy: { _sum: { dureeMinutes: "desc" } },
        take: 1,
      })
    : []

  // 3) Global (fallback)
  const topGlobal = topThisMonth.length === 0 && topPrevMonth.length === 0
    ? await prisma.temps.groupBy({
        by: ["missionId"],
        _sum: { dureeMinutes: true },
        orderBy: { _sum: { dureeMinutes: "desc" } },
        take: 1,
      })
    : []

  let missionPopulaire: {
    titre: string
    minutes: number
    periode: "Ce mois" | "Mois dernier" | "Global" | "Aucune saisie"
  } | null = null

const pickTop = async (
  topArr: { missionId: number; _sum: { dureeMinutes: number | null } }[],
  periode: "Ce mois" | "Mois dernier" | "Global"
) => {
  if (topArr.length === 0) return null
  const top = topArr[0]
  const mission = await prisma.mission.findUnique({
    where: { id: top.missionId },
    select: { id: true, titre: true },
  })
  if (!mission) return null
  return {
    id: mission.id,
    titre: mission.titre,
    minutes: top._sum.dureeMinutes ?? 0,
    periode,
  }
}


  missionPopulaire =
    (await pickTop(topThisMonth, "Ce mois")) ??
    (await pickTop(topPrevMonth, "Mois dernier")) ??
    (await pickTop(topGlobal, "Global")) ??
    null

  // 4) Dernier recours : s’il n’y a aucun temps en base mais qu’il existe des missions
  if (!missionPopulaire) {
    const anyMission = await prisma.mission.findFirst({
      orderBy: { createdAt: "desc" },
      select: { titre: true },
    })
    if (anyMission) {
      missionPopulaire = {
        titre: anyMission.titre,
        minutes: 0,
        periode: "Aucune saisie",
      }
    }
  }

  return NextResponse.json({
    minutesAujourdHui: tempsAujourdHui._sum.dureeMinutes || 0,
    joursTravaillesMois: nbJours,
    moyenneMinutesParJour,
    estimationSalaire,
    tjm: TJM,
    missionPopulaire,
  })
}

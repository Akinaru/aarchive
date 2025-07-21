import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { toZonedTime, format } from "date-fns-tz"
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from "date-fns"

export async function GET() {
  const timeZone = "Europe/Paris"
  const now = new Date()
  const todayStart = startOfDay(toZonedTime(now, timeZone))
  const todayEnd = endOfDay(toZonedTime(now, timeZone))
  const monthStart = startOfMonth(toZonedTime(now, timeZone))
  const monthEnd = endOfMonth(toZonedTime(now, timeZone))

  // ✅ Récupérer temps aujourd’hui
  const tempsAujourdHui = await prisma.temps.aggregate({
    where: {
      date: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
    _sum: { dureeMinutes: true },
  })

  // ✅ Récupérer tous les temps du mois
  const tempsMois = await prisma.temps.findMany({
    where: {
      date: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
    select: { date: true, dureeMinutes: true },
  })

  const uniqueJours = new Set(
    tempsMois.map(j => format(toZonedTime(j.date, timeZone), "yyyy-MM-dd"))
  )

  const totalMinutesMois = tempsMois.reduce((sum, t) => sum + t.dureeMinutes, 0)
  const nbJours = uniqueJours.size
  const moyenneMinutesParJour = nbJours > 0 ? Math.round(totalMinutesMois / nbJours) : 0

  // ✅ Récupérer TJM depuis parametre
  const paramTjm = await prisma.parametre.findUnique({ where: { id: "tjm" } })
  const TJM = paramTjm ? Number(paramTjm.value) : 100

  // ✅ Calcul estimation
  const estimationSalaire = nbJours * TJM

  return NextResponse.json({
    minutesAujourdHui: tempsAujourdHui._sum.dureeMinutes || 0,
    joursTravaillesMois: nbJours,
    moyenneMinutesParJour,
    estimationSalaire,
    tjm: TJM,
  })
}
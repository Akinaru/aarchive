import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { startOfWeek, endOfWeek, startOfDay, endOfDay } from "date-fns"

export async function GET() {
  const recentTemps = await prisma.temps.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      mission: { select: { titre: true, id: true, image: true } },
      typeTache: { select: { nom: true, id: true } },
    },
  })

  const now = new Date()
  const start = startOfWeek(now, { weekStartsOn: 1 })
  const end = endOfWeek(now, { weekStartsOn: 1 })

  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)

  const tempsSemaine = await prisma.temps.aggregate({
    _sum: { dureeMinutes: true },
    where: {
      date: {
        gte: start,
        lte: end,
      },
    },
  })

  const tempsAujourdHui = await prisma.temps.aggregate({
    _sum: { dureeMinutes: true },
    where: {
      date: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
  })

  return NextResponse.json({
    temps: recentTemps,
    totalSemaineMinutes: tempsSemaine._sum.dureeMinutes ?? 0,
    totalJourMinutes: tempsAujourdHui._sum.dureeMinutes ?? 0,
    objectifMinutes: 360,
  })
}
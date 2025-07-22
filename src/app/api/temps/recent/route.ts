import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { startOfWeek, endOfWeek } from "date-fns"

export async function GET() {
  const recentTemps = await prisma.temps.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      mission: { select: { titre: true, id: true } },
      typeTache: { select: { nom: true, id: true } },
    },
  })

  // 🗓 Début et fin de la semaine en cours (lundi à dimanche)
  const now = new Date()
  const start = startOfWeek(now, { weekStartsOn: 1 }) // lundi
  const end = endOfWeek(now, { weekStartsOn: 1 })     // dimanche

  // 🔢 Total minutes de la semaine
  const tempsSemaine = await prisma.temps.aggregate({
    _sum: { dureeMinutes: true },
    where: {
      date: {
        gte: start,
        lte: end,
      },
    },
  })

  const totalSemaineMinutes = tempsSemaine._sum.dureeMinutes ?? 0
  const objectifMinutes = 360 // optionnel

  return NextResponse.json({
    temps: recentTemps,
    totalSemaineMinutes,
    objectifMinutes,
  })
}
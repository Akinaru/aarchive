import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { startOfWeek, endOfWeek, startOfDay, endOfDay } from "date-fns"

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

export async function GET(req: NextRequest) {
  const page = parsePositiveInt(req.nextUrl.searchParams.get("page"), 1)
  const limit = parsePositiveInt(req.nextUrl.searchParams.get("limit"), 15)
  const skip = (page - 1) * limit

  const totalCount = await prisma.temps.count()

  const recentTemps = await prisma.temps.findMany({
    skip,
    take: limit,
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
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / limit)),
    },
    totalSemaineMinutes: tempsSemaine._sum.dureeMinutes ?? 0,
    totalJourMinutes: tempsAujourdHui._sum.dureeMinutes ?? 0,
    objectifMinutes: 360,
  })
}

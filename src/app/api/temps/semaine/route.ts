import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { startOfWeek, endOfWeek } from "date-fns"

export async function GET(req: NextRequest) {
  const dateParam = req.nextUrl.searchParams.get("date")
  const missionIdParam = req.nextUrl.searchParams.get("missionId")

  const baseDate = dateParam ? new Date(dateParam) : new Date()
  const start = startOfWeek(baseDate, { weekStartsOn: 1 })
  const end = endOfWeek(baseDate, { weekStartsOn: 1 })

  const where: any = {
    date: {
      gte: start,
      lte: end,
    },
  }

  if (missionIdParam) {
    where.missionId = parseInt(missionIdParam)
  }

  const temps = await prisma.temps.findMany({
    where,
    include: {
      mission: { select: { id: true, titre: true } },
      typeTache: { select: { id: true, nom: true } },
    },
    orderBy: { date: "asc" },
  })

  return NextResponse.json(temps)
}
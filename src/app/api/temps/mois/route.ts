import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  addWeeks,
  isBefore,
  isSameWeek,
} from "date-fns"

export async function GET(req: NextRequest) {
  const dateParam = req.nextUrl.searchParams.get("date")
  const missionIdParam = req.nextUrl.searchParams.get("missionId")

  const baseDate = dateParam ? new Date(dateParam) : new Date()
  const monthStart = startOfMonth(baseDate)
  const monthEnd = endOfMonth(baseDate)

  const where: any = {
    date: {
      gte: monthStart,
      lte: monthEnd,
    },
  }

  if (missionIdParam) {
    where.missionId = parseInt(missionIdParam)
  }

  const allTemps = await prisma.temps.findMany({
    where,
    include: {
      mission: {
        select: {
          id: true,
          titre: true,
          tjm: true,
          projet: { select: { id: true, nom: true } },
        },
      },
      typeTache: { select: { id: true, nom: true } },
    },
    orderBy: { date: "asc" },
  })

  const weeks = []
  let current = startOfWeek(monthStart, { weekStartsOn: 1 })

  while (isBefore(current, monthEnd) || isSameWeek(current, monthEnd, { weekStartsOn: 1 })) {
    const weekStart = current
    const weekEnd = endOfWeek(current, { weekStartsOn: 1 })

    const temps = allTemps.filter((t) =>
      isWithinInterval(new Date(t.date), {
        start: weekStart,
        end: weekEnd,
      })
    )

    weeks.push({
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      temps,
    })

    current = addWeeks(current, 1)
  }

  return NextResponse.json({
    monthStart: monthStart.toISOString(),
    monthEnd: monthEnd.toISOString(),
    weeks,
  })
}
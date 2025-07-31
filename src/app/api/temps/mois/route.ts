// app/api/temps/mois/route.ts
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
  const baseDate = dateParam ? new Date(dateParam) : new Date()

  const monthStart = startOfMonth(baseDate)
  const monthEnd = endOfMonth(baseDate)

  const allTemps = await prisma.temps.findMany({
    where: {
      date: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
    include: {
      mission: {
        select: {
          id: true,
          titre: true,
          projet: { select: { id: true, nom: true } },
        },
      },
      typeTache: { select: { id: true, nom: true } },
    },
    orderBy: { date: "asc" },
  })

  // Générer dynamiquement toutes les semaines du mois
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
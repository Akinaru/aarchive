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

  const monthlyByMission: Record<
    string,
    { missionId: number; titre: string; tjm: number; totalMinutes: number; amount: number }
  > = {}

  for (const t of allTemps) {
    const id = t.mission.id.toString()
    if (!monthlyByMission[id]) {
      monthlyByMission[id] = {
        missionId: t.mission.id,
        titre: t.mission.titre,
        tjm: t.mission.tjm ?? 0,
        totalMinutes: 0,
        amount: 0,
      }
    }
    monthlyByMission[id].totalMinutes += t.dureeMinutes
    monthlyByMission[id].amount += ((t.mission.tjm ?? 0) / 450) * t.dureeMinutes
  }

  const monthlyTotals = Object.values(monthlyByMission).reduce(
    (acc, m) => {
      acc.totalMinutes += m.totalMinutes
      acc.totalAmount += m.amount
      return acc
    },
    { totalMinutes: 0, totalAmount: 0 }
  )

  const weeks: Array<{
    weekStart: string
    weekEnd: string
    temps: typeof allTemps
    totals: { totalMinutes: number; totalAmount: number }
    byMission: Record<
      string,
      { missionId: number; titre: string; tjm: number; totalMinutes: number; amount: number }
    >
  }> = []

  let current = startOfWeek(monthStart, { weekStartsOn: 1 })

  while (isBefore(current, monthEnd) || isSameWeek(current, monthEnd, { weekStartsOn: 1 })) {
    const weekStart = current
    const weekEnd = endOfWeek(current, { weekStartsOn: 1 })

    const temps = allTemps.filter((t) =>
      isWithinInterval(new Date(t.date), { start: weekStart, end: weekEnd })
    )

    const byMission: Record<
      string,
      { missionId: number; titre: string; tjm: number; totalMinutes: number; amount: number }
    > = {}
    let totalMinutes = 0
    let totalAmount = 0

    for (const t of temps) {
      const id = t.mission.id.toString()
      if (!byMission[id]) {
        byMission[id] = {
          missionId: t.mission.id,
          titre: t.mission.titre,
          tjm: t.mission.tjm ?? 0,
          totalMinutes: 0,
          amount: 0,
        }
      }
      byMission[id].totalMinutes += t.dureeMinutes
      const amount = ((t.mission.tjm ?? 0) / 450) * t.dureeMinutes
      byMission[id].amount += amount
      totalMinutes += t.dureeMinutes
      totalAmount += amount
    }

    weeks.push({
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      temps,
      totals: { totalMinutes, totalAmount },
      byMission,
    })

    current = addWeeks(current, 1)
  }

  return NextResponse.json({
    monthStart: monthStart.toISOString(),
    monthEnd: monthEnd.toISOString(),
    weeks,
    monthlyByMission,
    monthlyTotals,
  })
}

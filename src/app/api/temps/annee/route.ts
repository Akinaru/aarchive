import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { startOfYear, endOfYear } from "date-fns"

export async function GET(req: NextRequest) {
  const yearParam = req.nextUrl.searchParams.get("year")

  const year = yearParam ? Number(yearParam) : new Date().getFullYear()
  if (!Number.isFinite(year) || year < 1970 || year > 2100) {
    return NextResponse.json({ error: "Paramètre year invalide" }, { status: 400 })
  }

  const baseDate = new Date(year, 0, 1)
  const yearStart = startOfYear(baseDate)
  const yearEnd = endOfYear(baseDate)

  const allTemps = await prisma.temps.findMany({
    where: {
      date: {
        gte: yearStart,
        lte: yearEnd,
      },
    },
    include: {
      mission: {
        select: {
          id: true,
          tjm: true,
          titre: true,
        },
      },
    },
    orderBy: { date: "asc" },
  })

  // 12 mois (0..11)
  const months = Array.from({ length: 12 }, () => ({
    totalMinutes: 0,
    totalAmount: 0,
  }))

  for (const t of allTemps) {
    const d = new Date(t.date)
    const m = d.getMonth() // 0..11

    const tjm = t.mission?.tjm ?? 0
    const amount = (tjm / 450) * t.dureeMinutes // 7h30 = 450 min

    months[m].totalMinutes += t.dureeMinutes
    months[m].totalAmount += amount
  }

  const payload = months.map((m, idx) => ({
    monthIndex: idx, // 0..11
    totalMinutes: m.totalMinutes,
    totalAmount: Number(m.totalAmount.toFixed(2)),
  }))

  const totals = payload.reduce(
    (acc, m) => {
      acc.totalMinutes += m.totalMinutes
      acc.totalAmount += m.totalAmount
      return acc
    },
    { totalMinutes: 0, totalAmount: 0 }
  )

  return NextResponse.json({
    year,
    months: payload,
    totals: {
      totalMinutes: totals.totalMinutes,
      totalAmount: Number(totals.totalAmount.toFixed(2)),
    },
  })
}

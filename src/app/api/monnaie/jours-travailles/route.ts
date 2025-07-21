import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { toZonedTime, format } from "date-fns-tz"

export async function GET() {
  const timeZone = "Europe/Paris"
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const jours = await prisma.temps.findMany({
    where: {
      date: {
        gte: firstDay,
        lte: lastDay,
      },
    },
    select: { date: true },
  })

  const uniqueJours = new Set(
    jours.map(j => {
      const zonedDate = toZonedTime(j.date, timeZone)
      return format(zonedDate, "yyyy-MM-dd")
    })
  )

  return NextResponse.json({ joursTravailles: uniqueJours.size })
}
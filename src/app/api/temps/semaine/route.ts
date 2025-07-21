import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { startOfWeek, endOfWeek } from "date-fns"

export async function GET() {
  const now = new Date()
  const start = startOfWeek(now, { weekStartsOn: 1 }) // lundi
  const end = endOfWeek(now, { weekStartsOn: 1 }) // dimanche

  const temps = await prisma.temps.findMany({
    where: {
      date: {
        gte: start,
        lte: end,
      },
    },
    include: {
      mission: { select: { titre: true } },
      typeTache: { select: { nom: true } },
    },
    orderBy: { date: "asc" },
  })

  return NextResponse.json(temps)
}
import { NextResponse } from "next/server"
import { startOfWeek, endOfWeek } from "date-fns"

import { prisma } from "@/lib/prisma"

export async function GET() {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 }) // lundi
  const end = endOfWeek(new Date(), { weekStartsOn: 1 })     // dimanche

  const temps = await prisma.temps.findMany({
    where: {
      date: {
        gte: start,
        lte: end,
      },
    },
    include: {
      mission: {
        select: { id: true, titre: true },
      },
      typeTache: {
        select: { id: true, nom: true },
      },
    },
    orderBy: { date: "asc" },
  })

  return NextResponse.json(temps)
}
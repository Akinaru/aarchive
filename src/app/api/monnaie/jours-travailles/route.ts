import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
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

  const uniqueJours = new Set(jours.map(j => j.date.toISOString().split("T")[0]))

  return NextResponse.json({ joursTravailles: uniqueJours.size })
}
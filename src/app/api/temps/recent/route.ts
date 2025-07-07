import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET() {
  const recentTemps = await prisma.temps.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      mission: { select: { titre: true, id: true } },
      typeTache: { select: { nom: true, id: true } },
    },
  })

  return NextResponse.json(recentTemps)
}
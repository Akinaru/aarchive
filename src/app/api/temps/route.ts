import { PrismaClient } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

const prisma = new PrismaClient()

// GET: /api/temps ou /api/temps?missionId=1
export async function GET(req: NextRequest) {
  const missionId = req.nextUrl.searchParams.get("missionId")

  const where = missionId
    ? { missionId: parseInt(missionId) }
    : undefined

  const temps = await prisma.temps.findMany({
    where,
    include: {
      mission: { select: { titre: true } },
      typeTache: { select: { nom: true } },
    },
    orderBy: { date: "desc" },
  })

  return NextResponse.json(temps)
}

export async function POST(req: Request) {
  const body = await req.json()

  if (!body.missionId || !body.typeTacheId || !body.dureeMinutes) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 })
  }

  const temps = await prisma.temps.create({
    data: {
      missionId: body.missionId,
      typeTacheId: body.typeTacheId,
      dureeMinutes: body.dureeMinutes,
      date: new Date(body.date),
      description: body.description || null,
    },
    include: {
      mission: { select: { titre: true } },
      typeTache: { select: { nom: true } },
    },
  })

  return NextResponse.json(temps)
}

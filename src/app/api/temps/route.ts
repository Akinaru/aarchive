import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET() {
  const temps = await prisma.temps.findMany({
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
      typeTache: { select: { nom: true } }
    },
  })

  return NextResponse.json(temps)
}

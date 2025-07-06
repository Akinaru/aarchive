import { Prisma, PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const id = parseInt(params.id)

  const deleted = await prisma.temps.delete({
    where: { id },
  })

  return NextResponse.json(deleted)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    console.log("Payload reçu :", body)

    if (!body.missionId || !body.typeTacheId || !body.dureeMinutes || !body.date) {
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
  })


    return NextResponse.json(temps)
  } catch (error) {
    console.error("Erreur dans la route POST /api/temps :", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
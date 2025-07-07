import { PrismaClient } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

const prisma = new PrismaClient()

// PUT: mise à jour d’un temps
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id)
  const body = await req.json()

  if (!body.dureeMinutes || !body.typeTacheId) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 })
  }

  const updated = await prisma.temps.update({
    where: { id },
    data: {
      dureeMinutes: body.dureeMinutes,
      typeTacheId: parseInt(body.typeTacheId),
      description: body.description || null,
    },
  })

  return NextResponse.json(updated)
}

// DELETE: déjà défini chez toi (recopié ici au cas où)
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const id = parseInt(params.id)

  const deleted = await prisma.temps.delete({
    where: { id },
  })

  return NextResponse.json(deleted)
}
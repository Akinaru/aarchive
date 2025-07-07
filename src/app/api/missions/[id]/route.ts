import { PrismaClient } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"

const prisma = new PrismaClient()

export const GET = async (
  req: NextRequest,
  context: { params: { id: string } }
) => {
  const id = parseInt(context.params.id)

  if (isNaN(id)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 })
  }

  const mission = await prisma.mission.findUnique({
    where: { id },
    include: {
      projet: { select: { nom: true } },
    },
  })

  if (!mission) {
    return NextResponse.json({ error: "Mission introuvable" }, { status: 404 })
  }

  return NextResponse.json(mission)
}

export const PUT = async (req: NextRequest, context: { params: { id: string } }) => {
  const id = parseInt(context.params.id)
  const body = await req.json()

  const updated = await prisma.mission.update({
    where: { id },
    data: {
      titre: body.titre,
      description: body.description,
      statut: body.statut,
      prixEstime: body.prixEstime,
      prixReel: body.prixReel,
      projetId: body.projetId,
    },
  })

  return NextResponse.json(updated)
}

export const DELETE = async (req: NextRequest, context: { params: { id: string } }) => {
  const id = parseInt(context.params.id)

  const deleted = await prisma.mission.delete({
    where: { id },
  })

  return NextResponse.json(deleted)
}

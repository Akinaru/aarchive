import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json()
  const id = parseInt(params.id)

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

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const id = parseInt(params.id)

  const deleted = await prisma.mission.delete({
    where: { id },
  })

  return NextResponse.json(deleted)
}

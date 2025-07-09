import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

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
      projet: {
        select: {
          nom: true,
          clients: {
            include: {
              client: true,
            },
          },
        },
      },
    },
  })

  if (!mission) {
    return NextResponse.json({ error: "Mission introuvable" }, { status: 404 })
  }

  return NextResponse.json(mission)
}

export const PUT = async (
  req: NextRequest,
  context: { params: { id: string } }
) => {
  const id = parseInt(context.params.id)
  const body = await req.json()

  const updated = await prisma.mission.update({
    where: { id },
    data: {
      titre: body.titre,
      description: body.description ?? null,
      statut: body.statut ?? undefined,
      projetId: body.projetId,
      dateDebut: body.dateDebut ? new Date(body.dateDebut) : undefined,
      dureePrevueMinutes: body.dureePrevueMinutes ?? undefined,
    },
  })

  return NextResponse.json(updated)
}

export const DELETE = async (
  req: NextRequest,
  context: { params: { id: string } }
) => {
  const id = parseInt(context.params.id)

  const deleted = await prisma.mission.delete({
    where: { id },
  })

  return NextResponse.json(deleted)
}
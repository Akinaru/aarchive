import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type ContextWithId = {
  params: {
    id: string
  }
}

// ✅ version strictement typée sans `any`
function isContextWithId(ctx: unknown): ctx is ContextWithId {
  if (typeof ctx !== "object" || ctx === null) return false

  const maybeContext = ctx as Record<string, unknown>
  const params = maybeContext["params"]

  if (typeof params !== "object" || params === null) return false

  const maybeParams = params as Record<string, unknown>
  const id = maybeParams["id"]

  return typeof id === "string"
}

export const GET = async (req: NextRequest, context: unknown) => {
  if (!isContextWithId(context)) {
    return NextResponse.json({ error: "Invalid context" }, { status: 400 })
  }

  const id = parseInt(context.params.id, 10)
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

export const PUT = async (req: NextRequest, context: unknown) => {
  if (!isContextWithId(context)) {
    return NextResponse.json({ error: "Invalid context" }, { status: 400 })
  }

  const id = parseInt(context.params.id, 10)
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

export const DELETE = async (req: NextRequest, context: unknown) => {
  if (!isContextWithId(context)) {
    return NextResponse.json({ error: "Invalid context" }, { status: 400 })
  }

  const id = parseInt(context.params.id, 10)

  const deleted = await prisma.mission.delete({
    where: { id },
  })

  return NextResponse.json(deleted)
}
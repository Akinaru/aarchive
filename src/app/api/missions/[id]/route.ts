import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type ContextWithId = {
  params: {
    id: string
  }
}

type MissionBody = {
  titre: string
  description?: string
  statut?: "EN_COURS" | "TERMINEE" | "EN_ATTENTE" | "ANNULEE"
  projetId: number
  dateDebut?: string
  dureePrevueMinutes?: number
  tjm?: number
  requiredDailyMinutes?: number
  image?: string
}

// ✅ type guard pour éviter tout any
function isContextWithId(ctx: unknown): ctx is ContextWithId {
  return (
      typeof ctx === "object" &&
      ctx !== null &&
      "params" in ctx &&
      typeof (ctx as { params: unknown }).params === "object" &&
      (ctx as { params: { id?: unknown } }).params !== null &&
      "id" in (ctx as { params: { id?: unknown } }).params &&
      typeof (ctx as { params: { id?: unknown } }).params.id === "string"
  )
}

export const GET = async (_req: NextRequest, context: unknown) => {
  if (!isContextWithId(context)) {
    return NextResponse.json({ error: "Invalid context" }, { status: 400 })
  }

  const id = Number.parseInt(context.params.id, 10)
  if (Number.isNaN(id)) {
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

  const id = Number.parseInt(context.params.id, 10)
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 })
  }

  const body: MissionBody = await req.json()

  if (!body.titre || !body.projetId) {
    return NextResponse.json({ error: "Titre et projet requis" }, { status: 400 })
  }

  const updated = await prisma.mission.update({
    where: { id },
    data: {
      titre: body.titre,
      description: body.description ?? null,
      statut: body.statut ?? undefined,
      projetId: body.projetId,
      dateDebut: body.dateDebut ? new Date(body.dateDebut) : undefined,
      dureePrevueMinutes: body.dureePrevueMinutes ?? undefined,
      tjm: body.tjm ?? null,
      requiredDailyMinutes: body.requiredDailyMinutes ?? null,
      image: body.image ?? null,
    },
  })

  return NextResponse.json(updated)
}

export const DELETE = async (_req: NextRequest, context: unknown) => {
  if (!isContextWithId(context)) {
    return NextResponse.json({ error: "Invalid context" }, { status: 400 })
  }

  const id = Number.parseInt(context.params.id, 10)
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 })
  }

  const deleted = await prisma.mission.delete({
    where: { id },
  })

  return NextResponse.json(deleted)
}

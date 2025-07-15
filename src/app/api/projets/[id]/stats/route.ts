import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type ContextWithId = {
  params: { id: string }
}

function isContextWithId(ctx: unknown): ctx is ContextWithId {
  if (typeof ctx !== "object" || ctx === null) return false

  const maybeContext = ctx as Record<string, unknown>
  const params = maybeContext["params"]

  if (typeof params !== "object" || params === null) return false

  const maybeParams = params as Record<string, unknown>
  const id = maybeParams["id"]

  return typeof id === "string"
}

export async function GET(_: Request, context: unknown) {
  if (!isContextWithId(context)) {
    return NextResponse.json({ error: "Invalid context" }, { status: 400 })
  }

  const id = parseInt(context.params.id, 10)

  if (isNaN(id)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 })
  }

  try {
    const projet = await prisma.projet.findUnique({
      where: { id },
      include: {
        clients: {
          include: {
            client: true,
          },
        },
        missions: true,
      },
    })

    if (!projet) {
      return NextResponse.json({ error: "Projet introuvable" }, { status: 404 })
    }

    const missionIds = projet.missions.map((m) => m.id)

    const temps = await prisma.temps.findMany({
      where: { missionId: { in: missionIds } },
      include: {
        mission: { select: { titre: true } },
        typeTache: true,
      },
    })

    const typeTaches = await prisma.typeTache.findMany()

    return NextResponse.json({
      projet,
      temps,
      typeTaches,
    })
  } catch (e) {
    console.error("[GET /projets/[id]/stats]", e)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
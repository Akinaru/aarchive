import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const id = parseInt(params.id)

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
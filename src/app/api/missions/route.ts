import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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

export async function GET() {
  try {
    const missions = await prisma.mission.findMany({
      include: {
        projet: { select: { nom: true } },
      },
      orderBy: { id: "desc" },
    })
    return NextResponse.json(missions)
  } catch (error) {
    console.error("Erreur GET /api/missions :", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const body: MissionBody = await req.json()

  if (!body.titre || !body.projetId) {
    return NextResponse.json({ error: "Titre et projet requis" }, { status: 400 })
  }

  const mission = await prisma.mission.create({
    data: {
      titre: body.titre,
      description: body.description ?? null,
      statut: body.statut ?? "EN_COURS",
      projetId: body.projetId,
      dateDebut: body.dateDebut ? new Date(body.dateDebut) : undefined,
      dureePrevueMinutes: body.dureePrevueMinutes ?? undefined,
      tjm: body.tjm ?? null,
      requiredDailyMinutes: body.requiredDailyMinutes ?? null,
      image: body.image ?? null,
    },
  })

  return NextResponse.json(mission)
}

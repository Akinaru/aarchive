import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET() {
  const missions = await prisma.mission.findMany({
    include: {
      projet: { select: { nom: true } },
    },
    orderBy: { id: "desc" },
  })
  return NextResponse.json(missions)
}

export async function POST(req: Request) {
  const body = await req.json()

  if (!body.titre || !body.projetId) {
    return NextResponse.json({ error: "Titre et projet requis" }, { status: 400 })
  }

  const mission = await prisma.mission.create({
    data: {
      titre: body.titre,
      description: body.description ?? null,
      statut: body.statut ?? "EN_COURS",
      prixEstime: body.prixEstime ?? 0,
      prixReel: body.prixReel ?? null,
      projetId: body.projetId,
    },
  })

  return NextResponse.json(mission)
}

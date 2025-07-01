import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET() {
  const projets = await prisma.projet.findMany({
    orderBy: { nom: "asc" },
    include: {
      missions: { select: { id: true } },
      clients: {
        include: {
          client: {
            select: { nom: true },
          },
        },
      },
    },
  })
  return NextResponse.json(projets)
}

export async function POST(req: Request) {
  const body = await req.json()

  if (!body.nom) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 })
  }

  const nouveauProjet = await prisma.projet.create({
    data: {
      nom: body.nom,
      description: body.description ?? null,
      clients: {
        create: (body.clientIds ?? []).map((clientId: number) => ({
          client: { connect: { id: clientId } },
        })),
      },
    },
    include: {
      missions: true,
      clients: { include: { client: true } },
    },
  })

  return NextResponse.json(nouveauProjet)
}


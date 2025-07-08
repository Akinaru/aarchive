import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET() {
  const clients = await prisma.client.findMany({
    orderBy: { nom: "asc" },
    include: {
      projets: {
        include: {
          projet: {
            include: {
              missions: {
                include: {
                  temps: true,
                },
              },
            },
          },
        },
      },
    },
  })

  const enrichedClients = clients.map((client) => {
    const missions = client.projets.flatMap((pc) => pc.projet?.missions || [])
    const temps = missions.flatMap((m) => m.temps || [])
    const totalMinutes = temps.reduce((sum, t) => sum + (t.dureeMinutes || 0), 0)

    return {
      ...client,
      nbProjets: client.projets.length,
      totalMinutes,
    }
  })

  return NextResponse.json(enrichedClients)
}

export async function POST(req: Request) {
  const body = await req.json()

  if (!body.nom) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 })
  }

  const nouveauClient = await prisma.client.create({
    data: {
      nom: body.nom,
      email: body.email ?? null,
      telephone: body.telephone ?? null,
      siteWeb: body.siteWeb ?? null,
      photoPath: body.photoPath ?? null,
    },
  })

  return NextResponse.json(nouveauClient)
}
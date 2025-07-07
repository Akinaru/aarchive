import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const clientId = parseInt(params.id)

  if (isNaN(clientId)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 })
  }

  // Étape 1 – Récupérer le client
  const client = await prisma.client.findUnique({
    where: { id: clientId },
  })

  if (!client) {
    return NextResponse.json({ error: "Client non trouvé" }, { status: 404 })
  }

  // Étape 2 – Récupérer les projets du client via ProjetClient
  const projetClients = await prisma.projetClient.findMany({
    where: { clientId },
    include: {
      projet: {
        include: {
          missions: {
            include: {
              temps: {
                include: { typeTache: true },
              },
            },
          },
        },
      },
    },
  })

  // Étape 3 – Extraire tous les temps
  const allTemps = projetClients.flatMap((pc) =>
    pc.projet.missions.flatMap((mission) =>
      mission.temps.map((t) => ({
        ...t,
        missionId: mission.id,
      }))
    )
  )

  // Étape 4 – Extraire tous les types de tâche distincts
  const typeTacheMap = new Map<number, { id: number; nom: string }>()
  allTemps.forEach((t) => {
    if (t.typeTache) {
      typeTacheMap.set(t.typeTache.id, {
        id: t.typeTache.id,
        nom: t.typeTache.nom,
      })
    }
  })

  const typeTaches = Array.from(typeTacheMap.values())

  return NextResponse.json({
    client,
    temps: allTemps,
    typeTaches,
  })
}
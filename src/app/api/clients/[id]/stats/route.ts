import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type ContextWithId = {
  params: { id: string }
}

export async function GET(req: Request, context: unknown) {
  if (!isContextWithId(context)) {
    return NextResponse.json({ error: "Invalid context" }, { status: 400 })
  }

  const clientId = parseInt(context.params.id, 10)

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

// ✅ Type guard pour vérifier context.params.id sans utiliser `any`
function isContextWithId(ctx: unknown): ctx is ContextWithId {
  return (
    typeof ctx === "object" &&
    ctx !== null &&
    "params" in ctx &&
    typeof (ctx as { params?: unknown }).params === "object" &&
    (ctx as { params: { id?: unknown } }).params !== null &&
    "id" in (ctx as { params: { id?: unknown } }).params &&
    typeof (ctx as { params: { id?: unknown } }).params.id === "string"
  )
}
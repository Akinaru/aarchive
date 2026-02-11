import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  // 1) clients + nb projets (via count)
  const clients = await prisma.client.findMany({
    orderBy: { nom: "asc" },
    include: {
      _count: {
        select: { projets: true },
      },
    },
  })

  // 2) totalMinutes par client via groupBy (évite include deep projets->missions->temps)
  // On suppose : Temps -> missionId ; Mission -> projetId ; ProjetClient -> (projetId, clientId)
  const minutesByMission = await prisma.temps.groupBy({
    by: ["missionId"],
    _sum: { dureeMinutes: true },
  })

  // Map missionId -> minutes
  const minutesByMissionId = new Map<number, number>()
  for (const row of minutesByMission) {
    minutesByMissionId.set(row.missionId, Number(row._sum.dureeMinutes ?? 0))
  }

  // Mission -> Projet -> Clients (via ProjetClient)
  const missions = await prisma.mission.findMany({
    select: {
      id: true,
      projet: {
        select: {
          clients: {
            select: { clientId: true },
          },
        },
      },
    },
  })

  // clientId -> totalMinutes
  const totalMinutesByClientId = new Map<number, number>()

  for (const m of missions) {
    const minutes = minutesByMissionId.get(m.id) ?? 0
    if (!minutes) continue

    const clientIds = m.projet?.clients?.map((pc) => pc.clientId) ?? []
    for (const clientId of clientIds) {
      totalMinutesByClientId.set(
          clientId,
          (totalMinutesByClientId.get(clientId) ?? 0) + minutes
      )
    }
  }

  const enrichedClients = clients.map((client) => ({
    ...client,
    nbProjets: client._count?.projets ?? 0,
    totalMinutes: totalMinutesByClientId.get(client.id) ?? 0,
    _count: undefined,
  }))

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

      // ✅ champs admin/facture (noms Prisma)
      legalName: body.legalName ?? null,
      billingEmail: body.billingEmail ?? null,

      addressLine1: body.addressLine1 ?? null,
      addressLine2: body.addressLine2 ?? null,
      postalCode: body.postalCode ?? null,
      city: body.city ?? null,
      state: body.state ?? null,

      countryCode: body.countryCode ?? null,
      companyRegistrationNumber: body.companyRegistrationNumber ?? null,
      tvaNumber: body.tvaNumber ?? null,
      billingNote: body.billingNote ?? null,
    },
  })

  return NextResponse.json(nouveauClient)
}

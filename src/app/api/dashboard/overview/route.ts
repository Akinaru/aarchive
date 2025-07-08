import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export async function GET() {
  const [missionsEnCours, projetsActifs, totalTemps, clientsActifs] = await Promise.all([
    prisma.mission.count({
      where: { statut: "EN_COURS" },
    }),
    prisma.projet.count({
      where: {
        missions: { some: {} }, // Projet avec au moins une mission
      },
    }),
    prisma.temps.aggregate({
      _sum: { dureeMinutes: true },
    }),
    prisma.client.count({
      where: {
        projets: { some: {} }, // Client avec au moins un projet
      },
    }),
  ])

  return NextResponse.json({
    missionsEnCours,
    projetsActifs,
    totalTempsMinutes: totalTemps._sum.dureeMinutes || 0,
    clientsActifs,
  })
}
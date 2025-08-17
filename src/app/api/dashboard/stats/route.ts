// app/api/dashboard/stats/route.ts
import { NextResponse } from "next/server"
import { startOfWeek, endOfWeek } from "date-fns"
import { formatMinutes } from "@/lib/time"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const now = new Date()
  const startWeek = startOfWeek(now, { weekStartsOn: 1 })
  const endWeek = endOfWeek(now, { weekStartsOn: 1 })

  const [
    missionLongest,
    clientMostActive,
    mostUsedType,
    latestMission,
    clientMostWorked,
    totalProjects,
    weekTotalTemps,
    totalTypes,
    missionWithMostTypes,
    missionsWithTemps,
  ] = await Promise.all([
    prisma.mission.findFirst({
      orderBy: { dureePrevueMinutes: "desc" },
      select: { titre: true, dureePrevueMinutes: true },
    }),
    prisma.client.findFirst({
      orderBy: { projets: { _count: "desc" } },
      include: { projets: true },
    }),
    prisma.typeTache.findMany({ include: { temps: true } }),
    prisma.mission.findFirst({
      orderBy: { createdAt: "desc" as const },
      select: { titre: true, createdAt: true },
    }),
    prisma.client.findMany({
      include: {
        projets: {
          include: {
            projet: {
              include: { missions: { include: { temps: true } } },
            },
          },
        },
      },
    }),
    prisma.projet.count(),
    prisma.temps.aggregate({
      _sum: { dureeMinutes: true },
      where: { date: { gte: startWeek, lte: endWeek } },
    }),
    prisma.typeTache.count(),
    prisma.mission.findMany({
      select: { titre: true, temps: { select: { typeTacheId: true } } },
    }),
    prisma.mission.findMany({ include: { temps: true } }),
  ])

  const mostFrequentType = mostUsedType
    .map((t) => ({ nom: t.nom, total: t.temps.length }))
    .sort((a, b) => b.total - a.total)[0]

  const clientWithMostWorked = clientMostWorked
    .map((client) => {
      const minutes = client.projets.reduce((sum, pc) => {
        const projet = pc.projet
        const missionMinutes = projet.missions.reduce((ms, m) => {
          return ms + m.temps.reduce((ts, t) => ts + t.dureeMinutes, 0)
        }, 0)
        return sum + missionMinutes
      }, 0)
      return { nom: client.nom, minutes, photoPath: client.photoPath }
    })
    .sort((a, b) => b.minutes - a.minutes)[0]

  const missionTypesCount = missionWithMostTypes.map((m) => {
    const uniqueTypes = new Set(m.temps.map((t) => t.typeTacheId))
    return { titre: m.titre, count: uniqueTypes.size }
  })
  const missionMostTypes = missionTypesCount.sort((a, b) => b.count - a.count)[0]

  const totalDurationMinutes = missionsWithTemps.reduce((total, mission) => {
    const missionTotal = mission.temps.reduce((sum, t) => sum + t.dureeMinutes, 0)
    return total + missionTotal
  }, 0)
  const moyenneTempsParMission =
    missionsWithTemps.length > 0 ? Math.round(totalDurationMinutes / missionsWithTemps.length) : 0

  return NextResponse.json([
    {
      label: "Mission la plus longue (prévue)",
      value: missionLongest
        ? `${missionLongest.titre} — ${formatMinutes(missionLongest.dureePrevueMinutes ?? 0)}`
        : "—",
    },
    {
      label: "Client avec le plus de projets",
      value: clientMostActive ? `${clientMostActive.nom} — ${clientMostActive.projets.length} projets` : "—",
      avatar: clientMostActive?.photoPath ?? null,
    },
    {
      label: "Type de tâche le plus fréquent",
      value: mostFrequentType ? `${mostFrequentType.nom} — ${mostFrequentType.total} utilisations` : "—",
    },
    {
      label: "Dernière mission créée",
      value:
        latestMission?.titre && latestMission?.createdAt
          ? `${latestMission.titre} — ${new Date(latestMission.createdAt).toLocaleDateString("fr-FR")}`
          : "—",
    },
    {
      label: "Client avec le plus de temps saisi",
      value: clientWithMostWorked ? `${clientWithMostWorked.nom} — ${formatMinutes(clientWithMostWorked.minutes)}` : "—",
      avatar: clientWithMostWorked?.photoPath ?? null,
    },
    {
      label: "Nombre total de projets",
      value: `${totalProjects} projets`,
    },
    {
      label: "Durée moyenne des missions",
      value: `${formatMinutes(moyenneTempsParMission)} (temps réel)`,
    },
    {
      label: "Temps saisi cette semaine",
      value: `${formatMinutes(weekTotalTemps._sum.dureeMinutes ?? 0)} — ${startWeek.toLocaleDateString("fr-FR")} - ${endWeek.toLocaleDateString("fr-FR")}`,
    },
    {
      label: "Nombre total de types de tâche",
      value: `${totalTypes} types`,
    },
    {
      label: "Mission avec le plus de types utilisés",
      value: missionMostTypes ? `${missionMostTypes.titre} — ${missionMostTypes.count} types` : "—",
    },
  ])
}

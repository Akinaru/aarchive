// src/app/api/count/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const [clients, projets, missions, typesTache] = await Promise.all([
      prisma.client.count(),
      prisma.projet.count(),
      prisma.mission.count(),
      prisma.typeTache.count(),
    ])

    return NextResponse.json(
      { clients, projets, missions, typesTache },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, must-revalidate" },
      }
    )
  } catch (error) {
    console.error("[GET] /api/count error:", error)
    return NextResponse.json(
      { error: "Failed to compute counts" },
      {
        status: 500,
        headers: { "Cache-Control": "no-store, must-revalidate" },
      }
    )
  }
}

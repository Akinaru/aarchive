// app/api/count/route.ts
import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

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
        headers: {
          "Cache-Control": "no-store, must-revalidate",
        },
      }
    )
  } catch (err) {
    console.error("[/api/count] Error:", err)
    return NextResponse.json(
      { error: "Failed to compute counts" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, must-revalidate",
        },
      }
    )
  }
}

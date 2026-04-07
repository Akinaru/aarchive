// lib/prisma.ts
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function buildPrismaClient() {
  return new PrismaClient({
    log: ["query"],
  })
}

function canReusePrismaClient(client: PrismaClient | undefined): client is PrismaClient {
  if (!client) return false

  // In dev, after schema updates + hot reload, global prisma can be stale and miss new delegates.
  // If that happens, force a fresh PrismaClient instance.
  const maybeClient = client as unknown as {
    moyenPaiement?: unknown
    projetMoyenPaiement?: unknown
  }

  return (
    typeof maybeClient.moyenPaiement !== "undefined" &&
    typeof maybeClient.projetMoyenPaiement !== "undefined"
  )
}

export const prisma =
  canReusePrismaClient(globalForPrisma.prisma)
    ? globalForPrisma.prisma
    : buildPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type ContextWithId = {
  params: { id: string }
}

function isContextWithId(ctx: unknown): ctx is ContextWithId {
  if (typeof ctx !== "object" || ctx === null) return false

  const maybeContext = ctx as Record<string, unknown>
  const params = maybeContext["params"]

  if (typeof params !== "object" || params === null) return false

  const maybeParams = params as Record<string, unknown>
  const id = maybeParams["id"]

  return typeof id === "string"
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function extractIds(value: unknown): number[] {
  if (!Array.isArray(value)) return []

  const ids = value
    .filter((item): item is number => typeof item === "number" && Number.isInteger(item))
    .filter((id) => id > 0)

  return Array.from(new Set(ids))
}

const includeProjetRelations = {
  missions: { select: { id: true } },
  clients: {
    select: {
      id: true,
      projetId: true,
      clientId: true,
      isBilling: true,
      client: {
        select: { id: true, nom: true, photoPath: true, email: true, telephone: true },
      },
    },
  },
  moyensPaiement: {
    select: {
      id: true,
      projetId: true,
      moyenPaiementId: true,
      moyenPaiement: {
        select: {
          id: true,
          nom: true,
          type: true,
          cryptoSymbol: true,
          cryptoNetwork: true,
          bankIban: true,
        },
      },
    },
  },
}

export async function PUT(req: Request, context: unknown) {
  if (!isContextWithId(context)) {
    return NextResponse.json({ error: "Invalid context" }, { status: 400 })
  }

  const id = parseInt(context.params.id, 10)
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 })
  }

  const rawBody = await req.json()
  const body =
    typeof rawBody === "object" && rawBody !== null
      ? (rawBody as Record<string, unknown>)
      : {}

  const nom = normalizeText(body.nom)
  if (!nom) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 })
  }

  const clientIds = extractIds(body.clientIds)
  const moyenPaiementIds = extractIds(body.moyenPaiementIds)

  const billingClientIdRaw = body.billingClientId
  const billingClientId: number | null =
    typeof billingClientIdRaw === "number" ? billingClientIdRaw : null

  if (clientIds.length > 0) {
    if (!billingClientId) {
      return NextResponse.json(
        { error: "billingClientId requis si des clients sont associés" },
        { status: 400 }
      )
    }

    if (!clientIds.includes(billingClientId)) {
      return NextResponse.json(
        { error: "billingClientId doit être inclus dans clientIds" },
        { status: 400 }
      )
    }
  }

  if (moyenPaiementIds.length > 0) {
    const found = await prisma.moyenPaiement.findMany({
      where: { id: { in: moyenPaiementIds } },
      select: { id: true },
    })

    if (found.length !== moyenPaiementIds.length) {
      return NextResponse.json(
        { error: "Un ou plusieurs moyens de paiement sont invalides" },
        { status: 400 }
      )
    }
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.projetClient.deleteMany({
        where: { projetId: id },
      })

      await tx.projetMoyenPaiement.deleteMany({
        where: { projetId: id },
      })

      return await tx.projet.update({
        where: { id },
        data: {
          nom,
          description: normalizeText(body.description),
          clients: {
            create: clientIds.map((clientId) => ({
              client: { connect: { id: clientId } },
              isBilling: billingClientId ? clientId === billingClientId : false,
            })),
          },
          moyensPaiement: {
            create: moyenPaiementIds.map((moyenPaiementId) => ({
              moyenPaiement: { connect: { id: moyenPaiementId } },
            })),
          },
        },
        include: includeProjetRelations,
      })
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour." },
      { status: 500 }
    )
  }
}

export async function DELETE(_: Request, context: unknown) {
  if (!isContextWithId(context)) {
    return NextResponse.json({ error: "Invalid context" }, { status: 400 })
  }

  const id = parseInt(context.params.id, 10)
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 })
  }

  try {
    await prisma.mission.deleteMany({
      where: { projetId: id },
    })

    await prisma.projetClient.deleteMany({
      where: { projetId: id },
    })

    await prisma.projetMoyenPaiement.deleteMany({
      where: { projetId: id },
    })

    const deleted = await prisma.projet.delete({
      where: { id },
    })

    return NextResponse.json(deleted)
  } catch (error) {
    console.error("Erreur lors de la suppression du projet :", error)
    return NextResponse.json(
      { error: "Suppression impossible. Vérifiez les dépendances." },
      { status: 500 }
    )
  }
}

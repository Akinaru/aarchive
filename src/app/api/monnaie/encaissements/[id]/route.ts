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
  return typeof maybeParams["id"] === "string"
}

function parsePositiveInt(input: unknown): number | null {
  const value = typeof input === "string" ? Number.parseInt(input, 10) : Number(input)
  return Number.isInteger(value) && value > 0 ? value : null
}

function parseOptionalPositiveInt(input: unknown): number | null {
  if (input === null || input === undefined || input === "") return null
  return parsePositiveInt(input)
}

function parseAmount(input: unknown): number | null {
  const raw =
    typeof input === "string"
      ? Number.parseFloat(input.replace(",", "."))
      : typeof input === "number"
        ? input
        : NaN

  if (!Number.isFinite(raw) || raw <= 0) return null
  return Number(raw.toFixed(2))
}

function parseDateFromInput(input: unknown): Date | null {
  if (typeof input !== "string") return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.trim())
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month, day, 12, 0, 0, 0))

  return Number.isNaN(date.getTime()) ? null : date
}

function normalizeDescription(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function parseMonth(input: unknown): number | null {
  const value = parsePositiveInt(input)
  if (!value) return null
  return value >= 1 && value <= 12 ? value : null
}

function parseYear(input: unknown): number | null {
  const value = parsePositiveInt(input)
  if (!value) return null
  return value >= 1900 && value <= 2200 ? value : null
}

export async function PUT(req: Request, context: unknown) {
  if (!isContextWithId(context)) {
    return NextResponse.json({ error: "Invalid context" }, { status: 400 })
  }

  const id = Number.parseInt(context.params.id, 10)
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 })
  }

  const body = (await req.json()) as Record<string, unknown>
  const projetId = parsePositiveInt(body.projetId)
  const datePaiement = parseDateFromInput(body.datePaiement)
  const moisReference = parseMonth(body.moisReference)
  const anneeReference = parseYear(body.anneeReference)
  const moyenPaiementId = parseOptionalPositiveInt(body.moyenPaiementId)
  const montantRecu = parseAmount(body.montantRecu)
  const description = normalizeDescription(body.description)

  if (!projetId || !datePaiement || !moisReference || !anneeReference || montantRecu === null) {
    return NextResponse.json(
      { error: "projetId, datePaiement, moisReference, anneeReference et montantRecu sont requis" },
      { status: 400 }
    )
  }

  const projetExists = await prisma.projet.findUnique({
    where: { id: projetId },
    select: { id: true },
  })

  if (!projetExists) {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 })
  }

  if (moyenPaiementId) {
    const moyenExists = await prisma.moyenPaiement.findUnique({
      where: { id: moyenPaiementId },
      select: { id: true },
    })

    if (!moyenExists) {
      return NextResponse.json(
        { error: "Moyen de paiement introuvable." },
        { status: 404 }
      )
    }
  }

  try {
    const updated = await prisma.paiementProjet.update({
      where: { id },
      data: {
        projetId,
        moyenPaiementId,
        datePaiement,
        moisReference,
        anneeReference,
        montantRecu,
        description,
      },
      include: {
        projet: {
          select: { id: true, nom: true },
        },
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
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Erreur PUT /api/monnaie/encaissements/[id] :", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(_: Request, context: unknown) {
  if (!isContextWithId(context)) {
    return NextResponse.json({ error: "Invalid context" }, { status: 400 })
  }

  const id = Number.parseInt(context.params.id, 10)
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 })
  }

  try {
    await prisma.paiementProjet.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur DELETE /api/monnaie/encaissements/[id] :", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

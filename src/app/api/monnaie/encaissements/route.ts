import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

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

function parseStartOfDay(input: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.trim())
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month, day, 0, 0, 0, 0))

  return Number.isNaN(date.getTime()) ? null : date
}

function parseEndOfDay(input: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.trim())
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month, day, 23, 59, 59, 999))

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

export async function GET(req: NextRequest) {
  const projetIdParam = req.nextUrl.searchParams.get("projetId")
  const fromParam = req.nextUrl.searchParams.get("from")
  const toParam = req.nextUrl.searchParams.get("to")

  const where: Prisma.PaiementProjetWhereInput = {}

  if (projetIdParam) {
    const projetId = parsePositiveInt(projetIdParam)
    if (!projetId) {
      return NextResponse.json({ error: "projetId invalide" }, { status: 400 })
    }
    where.projetId = projetId
  }

  if (fromParam || toParam) {
    const datePaiementFilter: Prisma.DateTimeFilter = {}

    if (fromParam) {
      const fromDate = parseStartOfDay(fromParam)
      if (!fromDate) {
        return NextResponse.json({ error: "Paramètre from invalide (YYYY-MM-DD)" }, { status: 400 })
      }
      datePaiementFilter.gte = fromDate
    }

    if (toParam) {
      const toDate = parseEndOfDay(toParam)
      if (!toDate) {
        return NextResponse.json({ error: "Paramètre to invalide (YYYY-MM-DD)" }, { status: 400 })
      }
      datePaiementFilter.lte = toDate
    }

    where.datePaiement = datePaiementFilter
  }

  try {
    const encaissements = await prisma.paiementProjet.findMany({
      where,
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
      orderBy: [{ datePaiement: "desc" }, { createdAt: "desc" }],
    })

    return NextResponse.json(encaissements)
  } catch (error) {
    console.error("Erreur GET /api/monnaie/encaissements :", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(req: Request) {
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

  const created = await prisma.paiementProjet.create({
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

  return NextResponse.json(created, { status: 201 })
}

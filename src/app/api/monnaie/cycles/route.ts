import { Prisma } from "@prisma/client"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function parsePositiveInt(input: unknown): number | null {
  const value = typeof input === "string" ? Number.parseInt(input, 10) : Number(input)
  return Number.isInteger(value) && value > 0 ? value : null
}

function parseTrimestre(input: unknown): number | null {
  const value = parsePositiveInt(input)
  if (!value) return null
  return value >= 1 && value <= 4 ? value : null
}

function parseAnnee(input: unknown): number | null {
  const value = parsePositiveInt(input)
  if (!value) return null
  return value >= 2000 && value <= 2200 ? value : null
}

function parseDateTime(input: unknown): Date | null {
  if (typeof input !== "string") return null
  const date = new Date(input)
  return Number.isNaN(date.getTime()) ? null : date
}

export async function GET() {
  try {
    const cycles = await prisma.cycleDeclaration.findMany({
      orderBy: [{ annee: "asc" }, { trimestre: "asc" }],
    })

    return NextResponse.json(cycles)
  } catch (error) {
    console.error("Erreur GET /api/monnaie/cycles :", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const body = (await req.json()) as Record<string, unknown>

  const annee = parseAnnee(body.annee)
  const trimestre = parseTrimestre(body.trimestre)
  const debutSaisie = parseDateTime(body.debutSaisie)
  const finSaisie = parseDateTime(body.finSaisie)

  if (!annee || !trimestre || !debutSaisie || !finSaisie) {
    return NextResponse.json(
      { error: "annee, trimestre, debutSaisie et finSaisie sont requis" },
      { status: 400 }
    )
  }

  if (debutSaisie >= finSaisie) {
    return NextResponse.json(
      { error: "La date de fin de saisie doit être après la date de début." },
      { status: 400 }
    )
  }

  try {
    const created = await prisma.cycleDeclaration.create({
      data: {
        annee,
        trimestre,
        debutSaisie,
        finSaisie,
      },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: `Le cycle T${trimestre} ${annee} existe déjà.` },
        { status: 409 }
      )
    }

    console.error("Erreur POST /api/monnaie/cycles :", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

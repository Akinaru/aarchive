import { Prisma } from "@prisma/client"
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

export async function PUT(req: Request, context: unknown) {
  if (!isContextWithId(context)) {
    return NextResponse.json({ error: "Invalid context" }, { status: 400 })
  }

  const id = Number.parseInt(context.params.id, 10)
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 })
  }

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
    const updated = await prisma.cycleDeclaration.update({
      where: { id },
      data: {
        annee,
        trimestre,
        debutSaisie,
        finSaisie,
      },
    })

    return NextResponse.json(updated)
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

    console.error("Erreur PUT /api/monnaie/cycles/[id] :", error)
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
    await prisma.cycleDeclaration.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur DELETE /api/monnaie/cycles/[id] :", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

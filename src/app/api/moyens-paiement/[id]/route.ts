import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type ContextWithId = {
  params: { id: string }
}

type TypeMoyenPaiement = "CRYPTO" | "BANCAIRE"

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

function normalizeIban(value: unknown): string | null {
  if (typeof value !== "string") return null
  const compact = value.replace(/\s+/g, "").toUpperCase()
  return compact.length > 0 ? compact : null
}

function isIbanFormatValid(iban: string): boolean {
  return /^[A-Z]{2}[0-9A-Z]{13,32}$/.test(iban)
}

function parseType(value: unknown): TypeMoyenPaiement | null {
  return value === "CRYPTO" || value === "BANCAIRE" ? value : null
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

  const type = parseType(body.type)
  if (!type) {
    return NextResponse.json(
      { error: "Type invalide (CRYPTO ou BANCAIRE)" },
      { status: 400 }
    )
  }

  const cryptoSymbol = normalizeText(body.cryptoSymbol)?.toUpperCase() ?? null
  const cryptoNetwork = normalizeText(body.cryptoNetwork)
  const bankAccountHolder = normalizeText(body.bankAccountHolder)
  const bankIban = normalizeIban(body.bankIban)

  if (type === "CRYPTO" && !cryptoSymbol) {
    return NextResponse.json({ error: "Crypto requise pour un moyen crypto" }, { status: 400 })
  }

  if (type === "BANCAIRE" && !bankIban) {
    return NextResponse.json(
      { error: "IBAN requis pour un moyen bancaire" },
      { status: 400 }
    )
  }

  if (bankIban && !isIbanFormatValid(bankIban)) {
    return NextResponse.json({ error: "Format IBAN invalide" }, { status: 400 })
  }

  try {
    const updated = await prisma.moyenPaiement.update({
      where: { id },
      data: {
        nom,
        type,
        cryptoSymbol: type === "CRYPTO" ? cryptoSymbol : null,
        cryptoNetwork: type === "CRYPTO" ? cryptoNetwork : null,
        bankAccountHolder: type === "BANCAIRE" ? bankAccountHolder : null,
        bankIban: type === "BANCAIRE" ? bankIban : null,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Erreur lors de la mise à jour du moyen de paiement:", error)
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
    const deleted = await prisma.moyenPaiement.delete({
      where: { id },
    })

    return NextResponse.json(deleted)
  } catch (error) {
    console.error("Erreur lors de la suppression du moyen de paiement:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression." },
      { status: 500 }
    )
  }
}

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type TypeMoyenPaiement = "CRYPTO" | "BANCAIRE"

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

export async function GET() {
  const moyensPaiement = await prisma.moyenPaiement.findMany({
    orderBy: [{ nom: "asc" }, { createdAt: "desc" }],
  })

  return NextResponse.json(moyensPaiement)
}

export async function POST(req: Request) {
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

  const created = await prisma.moyenPaiement.create({
    data: {
      nom,
      type,
      cryptoSymbol: type === "CRYPTO" ? cryptoSymbol : null,
      cryptoNetwork: type === "CRYPTO" ? cryptoNetwork : null,
      bankAccountHolder: type === "BANCAIRE" ? bankAccountHolder : null,
      bankIban: type === "BANCAIRE" ? bankIban : null,
    },
  })

  return NextResponse.json(created)
}

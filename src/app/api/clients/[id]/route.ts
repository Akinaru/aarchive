import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type ContextWithId = {
  params: {
    id: string
  }
}

type ClientBody = {
  nom: string
  email?: string | null
  telephone?: string | null
  siteWeb?: string | null
  photoPath?: string | null

  legalName?: string | null
  billingEmail?: string | null

  addressLine1?: string | null
  addressLine2?: string | null
  postalCode?: string | null
  city?: string | null
  state?: string | null

  // ✅ noms Prisma
  countryCode?: string | null
  companyRegistrationNumber?: string | null
  tvaNumber?: string | null
  billingNote?: string | null
}

export async function PUT(req: Request, context: unknown) {
  if (!isContextWithId(context)) {
    return NextResponse.json({ error: "Invalid context" }, { status: 400 })
  }

  const parsedId = Number.parseInt(context.params.id, 10)
  if (Number.isNaN(parsedId)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 })
  }

  const body: ClientBody = await req.json()

  if (!body.nom || !String(body.nom).trim()) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 })
  }

  const updated = await prisma.client.update({
    where: { id: parsedId },
    data: {
      nom: body.nom,
      email: body.email ?? null,
      telephone: body.telephone ?? null,
      siteWeb: body.siteWeb ?? null,
      photoPath: body.photoPath ?? null,

      legalName: body.legalName ?? null,
      billingEmail: body.billingEmail ?? null,

      addressLine1: body.addressLine1 ?? null,
      addressLine2: body.addressLine2 ?? null,
      postalCode: body.postalCode ?? null,
      city: body.city ?? null,
      state: body.state ?? null,

      countryCode: body.countryCode ?? null,
      companyRegistrationNumber: body.companyRegistrationNumber ?? null,
      tvaNumber: body.tvaNumber ?? null,
      billingNote: body.billingNote ?? null,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const parsedId = Number.parseInt(id, 10)
  if (Number.isNaN(parsedId)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 })
  }

  try {
    const result = await prisma.$transaction([
      prisma.projetClient.deleteMany({ where: { clientId: parsedId } }),
      prisma.client.delete({ where: { id: parsedId } }),
    ])

    const deleted = result[1]
    return NextResponse.json(deleted)
  } catch {
    return NextResponse.json(
        { error: "Erreur lors de la suppression du client." },
        { status: 500 }
    )
  }
}

// ✅ type guard pour éviter tout any
function isContextWithId(ctx: unknown): ctx is ContextWithId {
  return (
      typeof ctx === "object" &&
      ctx !== null &&
      "params" in ctx &&
      typeof (ctx as { params: unknown }).params === "object" &&
      (ctx as { params: { id?: unknown } }).params !== null &&
      "id" in (ctx as { params: { id?: unknown } }).params &&
      typeof (ctx as { params: { id?: unknown } }).params.id === "string"
  )
}

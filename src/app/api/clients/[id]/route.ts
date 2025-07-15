import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type ContextWithId = {
  params: {
    id: string
  }
}

type ClientBody = {
  nom: string
  email?: string
  telephone?: string
  siteWeb?: string
  photoPath?: string
}

export async function PUT(req: Request, context: unknown) {
  if (!isContextWithId(context)) {
    return NextResponse.json({ error: "Invalid context" }, { status: 400 })
  }

  const parsedId = parseInt(context.params.id, 10)
  const body: ClientBody = await req.json()

  if (!body.nom) {
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
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: Request, context: unknown) {
  if (!isContextWithId(context)) {
    return NextResponse.json({ error: "Invalid context" }, { status: 400 })
  }

  const parsedId = parseInt(context.params.id, 10)

  const deleted = await prisma.client.delete({
    where: { id: parsedId },
  })

  return NextResponse.json(deleted)
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
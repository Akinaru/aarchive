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

export async function PUT(req: Request, context: unknown) {
  if (!isContextWithId(context)) {
    return NextResponse.json({ error: "Invalid context" }, { status: 400 })
  }

  const id = parseInt(context.params.id, 10)
  const body = await req.json()

  if (!body.nom) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 })
  }

  const updated = await prisma.typeTache.update({
    where: { id },
    data: { nom: body.nom },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: Request, context: unknown) {
  if (!isContextWithId(context)) {
    return NextResponse.json({ error: "Invalid context" }, { status: 400 })
  }

  const id = parseInt(context.params.id, 10)

  const deleted = await prisma.typeTache.delete({
    where: { id },
  })

  return NextResponse.json(deleted)
}
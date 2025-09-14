import { NextRequest, NextResponse } from "next/server"
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

// PUT: mise à jour d’un temps
export async function PUT(req: NextRequest, context: unknown) {
  if (!isContextWithId(context)) {
    return NextResponse.json({ error: "Invalid context" }, { status: 400 })
  }

  const id = parseInt(context.params.id, 10)
  const body = await req.json()

  if (!body.dureeMinutes || !body.typeTacheId) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 })
  }

const updated = await prisma.temps.update({
  where: { id },
  data: {
    dureeMinutes: body.dureeMinutes,
    typeTacheId: parseInt(body.typeTacheId),
    description: body.description || null,
    date: body.date ? new Date(body.date) : undefined,
  },
})


  return NextResponse.json(updated)
}

// DELETE: suppression d’un temps
export async function DELETE(req: Request, context: unknown) {
  if (!isContextWithId(context)) {
    return NextResponse.json({ error: "Invalid context" }, { status: 400 })
  }

  const id = parseInt(context.params.id, 10)

  const deleted = await prisma.temps.delete({
    where: { id },
  })

  return NextResponse.json(deleted)
}
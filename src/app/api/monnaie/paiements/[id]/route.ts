import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

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

export async function DELETE(req: Request, context: unknown) {
  if (!isContextWithId(context)) {
    return NextResponse.json({ error: "Invalid context" }, { status: 400 })
  }

  const id = parseInt(context.params.id, 10)

  if (isNaN(id)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 })
  }

  try {
    await prisma.paiementMensuel.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur DELETE paiement :", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
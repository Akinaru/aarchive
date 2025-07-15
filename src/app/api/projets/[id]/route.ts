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

  try {
    await prisma.projetClient.deleteMany({
      where: { projetId: id },
    })

    const updated = await prisma.projet.update({
      where: { id },
      data: {
        nom: body.nom,
        description: body.description ?? null,
        clients: {
          create: (body.clientIds ?? []).map((clientId: number) => ({
            client: { connect: { id: clientId } },
          })),
        },
      },
      include: {
        missions: { select: { id: true } },
        clients: {
          include: {
            client: { select: { id: true, nom: true } },
          },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour." },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request, context: unknown) {
  if (!isContextWithId(context)) {
    return NextResponse.json({ error: "Invalid context" }, { status: 400 })
  }

  const id = parseInt(context.params.id, 10)

  try {
    await prisma.mission.deleteMany({
      where: { projetId: id },
    })

    await prisma.projetClient.deleteMany({
      where: { projetId: id },
    })

    const deleted = await prisma.projet.delete({
      where: { id },
    })

    return NextResponse.json(deleted)
  } catch (error) {
    console.error("Erreur lors de la suppression du projet :", error)
    return NextResponse.json(
      { error: "Suppression impossible. Vérifiez les dépendances." },
      { status: 500 }
    )
  }
}
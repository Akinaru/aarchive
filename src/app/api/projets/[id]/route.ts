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

  const clientIds: number[] = Array.isArray(body.clientIds) ? body.clientIds : []
  const billingClientIdRaw = body.billingClientId
  const billingClientId: number | null =
      typeof billingClientIdRaw === "number" ? billingClientIdRaw : null

  if (clientIds.length > 0) {
    if (!billingClientId) {
      return NextResponse.json(
          { error: "billingClientId requis si des clients sont associés" },
          { status: 400 }
      )
    }

    if (!clientIds.includes(billingClientId)) {
      return NextResponse.json(
          { error: "billingClientId doit être inclus dans clientIds" },
          { status: 400 }
      )
    }
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      // 1) reset pivot
      await tx.projetClient.deleteMany({
        where: { projetId: id },
      })

      // 2) update projet + recreate pivot
      return await tx.projet.update({
        where: { id },
        data: {
          nom: body.nom,
          description: body.description ?? null,
          clients: {
            create: clientIds.map((clientId: number) => ({
              client: { connect: { id: clientId } },
              isBilling: billingClientId ? clientId === billingClientId : false,
            })),
          },
        },
        include: {
          missions: { select: { id: true } },
          clients: {
            select: {
              id: true,
              projetId: true,
              clientId: true,
              isBilling: true,
              client: {
                select: { id: true, nom: true, photoPath: true },
              },
            },
          },
        },
      })
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

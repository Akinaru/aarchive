import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function PUT(req: Request, context: { params: { id: string } }) {
  const body = await req.json()
  const id = parseInt(context.params.id)

  if (!body.nom) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 })
  }

  try {
    // Supprimer les relations existantes (ProjetsClients)
    await prisma.projetClient.deleteMany({
      where: { projetId: id },
    })

    // Mettre à jour le projet
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
    return NextResponse.json({ error: "Erreur lors de la mise à jour." }, { status: 500 })
  }
}

export async function DELETE(req: Request, context: { params: { id: string } }) {
  const id = parseInt(context.params.id)

  try {
    // Supprimer les missions liées à ce projet
    await prisma.mission.deleteMany({
      where: { projetId: id },
    })

    // Supprimer les relations projet-client
    await prisma.projetClient.deleteMany({
      where: { projetId: id },
    })

    // Supprimer le projet une fois les dépendances supprimées
    const deleted = await prisma.projet.delete({
      where: { id },
    })

    return NextResponse.json(deleted)
  } catch (error) {
    console.error("Erreur lors de la suppression du projet :", error)
    return NextResponse.json({ error: "Suppression impossible. Vérifiez les dépendances." }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const projets = await prisma.projet.findMany({
    orderBy: { nom: "asc" },
    include: {
      missions: { select: { id: true } },
      clients: {
        select: {
          id: true,
          projetId: true,
          clientId: true,
          isBilling: true,
          client: true,
        },
      },
    },
  })

  return NextResponse.json(projets)
}

export async function POST(req: Request) {
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

  const nouveauProjet = await prisma.projet.create({
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

  return NextResponse.json(nouveauProjet)
}

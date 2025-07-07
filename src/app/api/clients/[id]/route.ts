import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json()
  const id = parseInt(params.id)

  if (!body.nom) {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 })
  }

  const updated = await prisma.client.update({
    where: { id },
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

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const id = parseInt(params.id)

  const deleted = await prisma.client.delete({
    where: { id },
  }) 

  return NextResponse.json(deleted)
}

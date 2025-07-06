import { PrismaClient } from "@prisma/client"
import { NextResponse } from "next/server"

const prisma = new PrismaClient()

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const id = parseInt(params.id)
  const body = await req.json()

  if (!body.nom || body.nom.trim() === "") {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 })
  }

  const updated = await prisma.typeTache.update({
    where: { id },
    data: { nom: body.nom },
  })

  return NextResponse.json(updated)
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const id = parseInt(params.id)

  const deleted = await prisma.typeTache.delete({
    where: { id },
  })

  return NextResponse.json(deleted)
}

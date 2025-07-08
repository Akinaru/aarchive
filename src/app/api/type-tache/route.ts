import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"

export async function GET() {
  const types = await prisma.typeTache.findMany({
    orderBy: { nom: "asc" },
  })

  return NextResponse.json(types)
}

export async function POST(req: Request) {
  const body = await req.json()

  if (!body.nom || body.nom.trim() === "") {
    return NextResponse.json({ error: "Nom requis" }, { status: 400 })
  }

  const type = await prisma.typeTache.create({
    data: { nom: body.nom },
  })

  return NextResponse.json(type)
}

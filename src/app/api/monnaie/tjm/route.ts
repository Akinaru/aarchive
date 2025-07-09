import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const param = await prisma.parametre.findUnique({ where: { id: "tjm" } })
  return NextResponse.json({ tjm: param?.value ?? 100 }) // fallback par défaut
}

export async function PUT(req: Request) {
  const body = await req.json()
  const value = parseFloat(body.tjm)
  if (isNaN(value) || value <= 0) {
    return NextResponse.json({ error: "TJM invalide" }, { status: 400 })
  }

  await prisma.parametre.upsert({
    where: { id: "tjm" },
    update: { value },
    create: { id: "tjm", value },
  })

  return NextResponse.json({ success: true })
}
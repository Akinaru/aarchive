// app/api/system/has-users/route.ts
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const count = await prisma.utilisateur.count()
  return NextResponse.json({ hasUsers: count > 0 })
}
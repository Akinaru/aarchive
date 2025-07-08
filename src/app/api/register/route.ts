import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hash } from "bcryptjs"

export async function POST(req: Request) {
  const { name, email, password } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Champs requis manquants" },
      { status: 400 }
    )
  }

  // Vérifie qu'aucun autre compte n'existe
  const userCount = await prisma.utilisateur.count()
  if (userCount > 0) {
    return NextResponse.json(
      { error: "Un compte existe déjà" },
      { status: 403 }
    )
  }

  // Vérifie si l'email est déjà utilisé
  const existing = await prisma.utilisateur.findUnique({
    where: { email },
  })

  if (existing) {
    return NextResponse.json(
      { error: "Email déjà utilisé" },
      { status: 409 }
    )
  }

  // Hash du mot de passe
  const hashed = await hash(password, 10)

  // Création du compte admin
  await prisma.utilisateur.create({
    data: {
      nom: name,
      email: email,
      motDePasse: hashed,
    },
  })

  return NextResponse.json({ success: true })
}
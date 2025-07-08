import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import RegisterClientForm from "@/components/form/register-form"
import { prisma } from "@/lib/prisma"

export default async function RegisterPage() {
  const userCount = await prisma.utilisateur.count()

  if (userCount > 0) {
    const session = await getServerSession(authOptions)
    if (session) redirect("/dashboard")
    else redirect("/login") // pour les non-connectés
  }

  // Aucun compte : on affiche le formulaire
  return <RegisterClientForm />
}
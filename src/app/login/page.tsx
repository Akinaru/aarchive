// app/login/page.tsx
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { redirect } from "next/navigation"
import LoginClientForm from "@/components/form/login-form"
import { prisma } from "@/lib/prisma"

export default async function LoginPage() {
  const session = await getServerSession(authOptions)
  if (session) redirect("/dashboard")

  const userCount = await prisma.utilisateur.count()
  if (userCount === 0) redirect("/register")

  return <LoginClientForm />
}
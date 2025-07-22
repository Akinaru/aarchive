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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-muted/50 to-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Aarchive</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Accès réservé aux utilisateurs autorisés
          </p>
        </div>
        <LoginClientForm />
      </div>
    </div>
  )
}
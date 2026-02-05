import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { LoginForm } from "@/components/form/login-form"

export default async function LoginPage() {
  const session = await getServerSession(authOptions)
  if (session) redirect("/dashboard")

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-muted/50 to-background px-4">
      <div className="w-full max-w-md space-y-6">
        <img
          src="/banner_transparent.svg"
          alt="Aarchive"
          className="mx-auto h-36 w-auto mb-0"
        />
        <LoginForm />
      </div>
    </div>
  )
}
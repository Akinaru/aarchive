"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function HomePage() {
  const { data: session, status } = useSession()

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 text-center space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Bienvenue sur <span className="text-primary">AArchive</span>
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          L’outil simple et efficace pour gérer tes clients, missions, projets et suivre ton temps de travail.
        </p>
        <Badge variant="outline">Projet personnel - Maxime Gallotta</Badge>
      </div>

      <div className="pt-6">
        {status === "loading" ? null : session ? (
          <Link href="/dashboard">
            <Button size="lg">Accéder au dashboard</Button>
          </Link>
        ) : (
          <Link href="/login">
            <Button size="lg">Se connecter</Button>
          </Link>
        )}
      </div>
    </main>
  )
}

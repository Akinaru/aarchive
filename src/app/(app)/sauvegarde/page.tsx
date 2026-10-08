"use client"

import { useState } from "react"
import { toast } from "sonner"
import { DatabaseBackup, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function filenameFromDisposition(header: string | null) {
  const match = header?.match(/filename="([^"]+)"/)
  return match?.[1] ?? "aarchive.sql"
}

export default function SauvegardePage() {
  const [isRunning, setIsRunning] = useState(false)

  const downloadBackup = async () => {
    setIsRunning(true)
    try {
      const res = await fetch("/api/sauvegarde", { cache: "no-store" })
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error || "La sauvegarde a échoué.")
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = filenameFromDisposition(res.headers.get("Content-Disposition"))
      link.click()
      URL.revokeObjectURL(url)
      toast.success("Sauvegarde téléchargée.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "La sauvegarde a échoué.")
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        title="Sauvegarde"
        subtitle="Export complet de la base de données."
        breadcrumb={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Sauvegarde" },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle>Sauvegarde manuelle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Télécharge un fichier <code>.sql</code> contenant toutes les données (clients, projets, missions, temps,
            encaissements, cycles…). Conserve-le hors du serveur.
          </p>
          <Button onClick={downloadBackup} disabled={isRunning}>
            {isRunning ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <DatabaseBackup className="w-4 h-4 mr-2" />
            )}
            Télécharger une sauvegarde
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Restaurer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Le fichier remplace les tables existantes. Sur le serveur, lance :
          </p>
          <pre className="rounded-md bg-muted p-3 text-xs overflow-x-auto">psql &quot;$DATABASE_URL&quot; -f aarchive-AAAA-MM-JJ_HH-mm-ss.sql</pre>
          <p>Si l'URL contient <code>?schema=public</code>, retire ce paramètre pour psql.</p>
        </CardContent>
      </Card>
    </div>
  )
}

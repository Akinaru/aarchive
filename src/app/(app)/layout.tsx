// src/app/(app)/layout.tsx  ← remplace tout le fichier par ceci
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/authOptions"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowUpFromLine, Terminal } from "lucide-react"
import { getLocalVersion, getRemoteVersion, compareVersions } from "@/lib/versioning"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Accès refusé</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Vous devez être connecté pour accéder à cette page.
            </p>
            <Link href="/login">
              <Button className="w-full">Se connecter</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const localVersion = getLocalVersion()
  const remoteVersion = await getRemoteVersion()
  const hasUpdate = !!remoteVersion && compareVersions(remoteVersion, localVersion) > 0

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />

        <main className="flex-1 p-4 md:p-6 flex flex-col items-center">
          {hasUpdate && (
            <Alert variant="info" className="max-w-6xl mb-3" closable={true}>
              <ArrowUpFromLine className="h-4 w-4" />
              <AlertTitle>Nouvelle version disponible !</AlertTitle>
              <AlertDescription>
                Version locale <strong>v{localVersion}</strong> &nbsp;→&nbsp; distante{" "}
                <strong>v{remoteVersion}</strong>. Pensez à mettre à jour.
              </AlertDescription>
            </Alert>
          )}

          <div className="w-full max-w-6xl">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}

import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return <div>Accès refusé</div>
  }

  return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar user={session.user} />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </SidebarProvider>
  )
}

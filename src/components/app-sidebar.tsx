'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
  SidebarMenu,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import {
  GalleryVerticalEnd,
  Contact,
  LayoutDashboard,
  Users,
  FolderGit2,
  Flag,
  TimerReset,
  ListTodo,
  PlusCircle,
  ShieldCheck,
  Euro,
} from "lucide-react"
import { NavUser } from "@/components/nav-user"
import { cn } from "@/lib/utils"
import { AppUser } from "@/types/appuser"

export function AppSidebar({ user }: { user: AppUser }) {
  const pathname = usePathname()
  const isAdmin = user?.role === "admin"
  const isValidated = user?.isValidated

  const isActive = (href: string) => pathname.startsWith(href)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" className="gap-3">
              <Link href="/" className="flex w-full items-center gap-3">
                <div className="bg-primary text-white flex aspect-square size-8 items-center justify-center rounded-lg">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm">
                  <span className="truncate font-semibold">Aarchive</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className={cn({ "bg-primary/10 text-primary": isActive("/dashboard") })}>
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 size-4" />
                    Dashboard
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className={cn({ "bg-primary/10 text-primary": isActive("/temps") })}>
                  <Link href="/temps">
                    <TimerReset className="mr-2 size-4" />
                    Notation des temps
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild className={cn({ "bg-primary/10 text-primary": isActive("/clients") })}>
                  <Link href="/clients">
                    <Users className="mr-2 size-4" />
                    Clients
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className={cn({ "bg-primary/10 text-primary": isActive("/projets") })}>
                  <Link href="/projets">
                    <FolderGit2 className="mr-2 size-4" />
                    Projets
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className={cn({ "bg-primary/10 text-primary": isActive("/missions") })}>
                  <Link href="/missions">
                    <Flag className="mr-2 size-4" />
                    Missions
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild className={cn({ "bg-primary/10 text-primary": isActive("/type-taches") })}>
                  <Link href="/type-taches">
                    <ListTodo className="mr-2 size-4" />
                    Types de tâche
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
  <SidebarMenuButton
    asChild
    className={cn({
      "bg-primary/10 text-primary": isActive("/monnaie"),
    })}
  >
    <Link href="/monnaie">
      <Euro className="mr-2 size-4" />
      Gestion monétaire
    </Link>
  </SidebarMenuButton>
</SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isValidated && (
          <SidebarGroup>
            <SidebarGroupLabel>Actions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className={cn({ "bg-primary/10 text-primary": isActive("/timesheet") })}>
                    <Link href="/timesheet">
                      <PlusCircle className="mr-2 size-4" />
                      Ma feuille de temps
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className={cn({ "bg-primary/10 text-primary": isActive("/admin/users") })}>
                    <Link href="/admin/users">
                      <ShieldCheck className="mr-2 size-4" />
                      Utilisateurs
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className={cn({ "bg-primary/10 text-primary": isActive("/contact") })}>
                  <Link href="/contact">
                    <Contact className="mr-2 size-4" />
                    Contact
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

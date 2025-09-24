// src/components/app-sidebar.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import React, { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import {
  LayoutDashboard,
  TimerReset,
  Users,
  FolderGit2,
  Flag,
  ListTodo,
  FileText,
  Euro,
  BarChart3,
  ChevronDown,
} from "lucide-react"
import { NavUser } from "@/components/nav-user"
import { cn } from "@/lib/utils"
import { getLocalVersion, getRemoteVersion, compareVersions } from "@/lib/versioning"

type CountResponse = {
  clients: number
  projets: number
  missions: number
  typesTache: number
  error?: string
}

export function AppSidebar() {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()

  const isActive = (href: string) => pathname.startsWith(href)
  const handleLinkClick = () => {
    if (isMobile) setOpenMobile(false)
  }

  const [counts, setCounts] = useState<CountResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    let aborted = false

    async function load() {
      try {
        setLoading(true)
        const res = await fetch("/api/count", { cache: "no-store" })
        const json: CountResponse = await res.json()
        if (!aborted) setCounts(json)
      } catch {
        if (!aborted) setCounts({ clients: 0, projets: 0, missions: 0, typesTache: 0, error: "fetch_failed" })
      } finally {
        if (!aborted) setLoading(false)
      }
    }

    load()

    const onFocus = () => load()
    window.addEventListener("visibilitychange", onFocus)
    window.addEventListener("focus", onFocus)
    return () => {
      aborted = true
      window.removeEventListener("visibilitychange", onFocus)
      window.removeEventListener("focus", onFocus)
    }
  }, [])

  const badge = (value?: number) => (loading ? "…" : typeof value === "number" ? value : "—")

  const localVersion = getLocalVersion()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" className="px-2 py-1.5">
              <Link
                href="/dashboard"
                onClick={handleLinkClick}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1 transition hover:bg-accent"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md">
                  <BarChart3 className="size-4" />
                </div>
                {/* Titre + versions */}
                <div className="flex min-w-0 flex-col">
                  <div className="text-lg font-bold tracking-tight">Aarchive</div>
                  <div className="text-xs text-muted-foreground leading-none">
                    {localVersion}
                  </div>
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
                  <Link href="/dashboard" onClick={handleLinkClick}>
                    <LayoutDashboard className="mr-2 size-4" />
                    Dashboard
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild className={cn({ "bg-primary/10 text-primary": isActive("/temps") })}>
                  <Link href="/temps" onClick={handleLinkClick}>
                    <TimerReset className="mr-2 size-4" />
                    Notation des temps
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* --- GROUPE GESTION COLLAPSIBLE --- */}
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex items-center w-full px-3 py-1.5 text-xs font-medium uppercase text-muted-foreground">
                Gestion
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180 size-4" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>

            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild className={cn({ "bg-primary/10 text-primary": isActive("/clients") })}>
                      <Link href="/clients" onClick={handleLinkClick}>
                        <Users className="mr-2 size-4" />
                        Clients
                      </Link>
                    </SidebarMenuButton>
                    <SidebarMenuBadge>{badge(counts?.clients)}</SidebarMenuBadge>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild className={cn({ "bg-primary/10 text-primary": isActive("/projets") })}>
                      <Link href="/projets" onClick={handleLinkClick}>
                        <FolderGit2 className="mr-2 size-4" />
                        Projets
                      </Link>
                    </SidebarMenuButton>
                    <SidebarMenuBadge>{badge(counts?.projets)}</SidebarMenuBadge>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild className={cn({ "bg-primary/10 text-primary": isActive("/missions") })}>
                      <Link href="/missions" onClick={handleLinkClick}>
                        <Flag className="mr-2 size-4" />
                        Missions
                      </Link>
                    </SidebarMenuButton>
                    <SidebarMenuBadge>{badge(counts?.missions)}</SidebarMenuBadge>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild className={cn({ "bg-primary/10 text-primary": isActive("/type-taches") })}>
                      <Link href="/type-taches" onClick={handleLinkClick}>
                        <ListTodo className="mr-2 size-4" />
                        Types de tâche
                      </Link>
                    </SidebarMenuButton>
                    <SidebarMenuBadge>{badge(counts?.typesTache)}</SidebarMenuBadge>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* --- GROUPE EXPORT/FINANCE COLLAPSIBLE --- */}
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex items-center w-full px-3 py-1.5 text-xs font-medium uppercase text-muted-foreground">
                Outils & Finance
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180 size-4" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>

            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      className={cn({ "bg-primary/10 text-primary": isActive("/export/semaine") })}
                    >
                      <Link href="/export/semaine" onClick={handleLinkClick}>
                        <FileText className="mr-2 size-4" />
                        Export semaine
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      className={cn({ "bg-primary/10 text-primary": isActive("/export/mois") })}
                    >
                      <Link href="/export/mois" onClick={handleLinkClick}>
                        <FileText className="mr-2 size-4" />
                        Export mois
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild className={cn({ "bg-primary/10 text-primary": isActive("/monnaie") })}>
                      <Link href="/monnaie" onClick={handleLinkClick}>
                        <Euro className="mr-2 size-4" />
                        Gestion monétaire
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

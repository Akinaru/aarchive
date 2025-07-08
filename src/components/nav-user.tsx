'use client'

import { signOut } from "next-auth/react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { LogOut, Sun, Moon } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { useUser } from "@/context/user-provider"
import { Skeleton } from "@/components/ui/skeleton"

export function NavUser() {
  const { user } = useUser()
  const { setTheme } = useTheme()

  const isLoading = !user

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer">
          {isLoading ? (
            <>
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </>
          ) : (
            <>
              <div className="bg-muted text-white font-bold h-8 w-8 rounded-full flex items-center justify-center">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold">{user.name}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </div>
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      {!isLoading && (
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href="/my-account">Mes infos</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/my-account/publications">Mes publications</Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Thème</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setTheme("light")}>
            <Sun className="mr-2 size-4" /> Clair
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")}>
            <Moon className="mr-2 size-4" /> Sombre
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
            <LogOut className="mr-2 size-4" /> Déconnexion
          </DropdownMenuItem>
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  )
}
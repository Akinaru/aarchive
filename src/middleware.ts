import { getToken } from "next-auth/jwt"
import { NextResponse, NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next()
  }

  // Appel à l’API interne pour savoir s’il y a des utilisateurs
  const res = await fetch(`/api/system/has-users`)
  const data = await res.json()
  const hasUsers = data.hasUsers

  if (!hasUsers) {
    if (pathname === "/register") return NextResponse.next()
    return NextResponse.redirect(new URL("/register", req.url))
  }

  const token = await getToken({ req })
  const isPublic = ["/", "/login"].includes(pathname)

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
}
import { withAuth } from "next-auth/middleware"
import { NextResponse, NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const token = await getToken({ req })

  // Si pas de token, redirige vers /login
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projets/:path*",
    "/type-taches/:path*",
    "/temps/:path*",
    "/missions/:path*"
  ],
}
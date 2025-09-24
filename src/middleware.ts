import { getToken } from "next-auth/jwt"
import { NextResponse, NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next()
  }

  const token = await getToken({ req })
  const isPublic = ["/", "/login", "/register"].includes(pathname)

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
}

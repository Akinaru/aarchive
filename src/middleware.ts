import { getToken } from "next-auth/jwt"
import { NextResponse, NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Exclure explicitement les fichiers /.well-known (Chrome DevTools, PWA, etc.)
  if (pathname.startsWith("/.well-known")) {
    return NextResponse.next()
  }

  // Laisse passer les routes internes Next + API + assets statiques (public/)
  // Sinon /icon-192x192.png redirige vers /login et iOS ne peut pas récupérer l’icône.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/apple-touch-icon.png" ||
    pathname === "/manifest.webmanifest" ||
    pathname.endsWith(".webmanifest") ||
    pathname.startsWith("/icon-") ||
    pathname.match(/\.[a-zA-Z0-9]+$/) // tout fichier avec extension (.png, .jpg, .css, .js, .svg, ...)
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

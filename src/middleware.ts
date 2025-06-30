export { default } from "next-auth/middleware"

export const config = {
  matcher: ["/dashboard/:path*", "/timesheet/:path*", "/projects/:path*"],
}

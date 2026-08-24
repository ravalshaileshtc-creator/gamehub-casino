import NextAuth from "next-auth"
import { authConfig } from "@/auth.config"
import { NextResponse } from "next/server"
import { rateLimitMiddleware, RateLimits, rateLimitResponse } from "@/middleware/rateLimit"

export default NextAuth(authConfig).auth(async (req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const isApiRoute = nextUrl.pathname.startsWith("/api")
  const isDashboardRoute = nextUrl.pathname.startsWith("/dashboard")
  const isAdminRoute = nextUrl.pathname.startsWith("/admin") || nextUrl.pathname.startsWith("/api/admin")
  const isPublicRoute = ["/", "/login", "/register"].includes(nextUrl.pathname)

  // 1. Rate Limiting for API routes
  if (isApiRoute) {
    let limitConfig = RateLimits.api

    if (nextUrl.pathname.includes("/bets") || nextUrl.pathname.includes("/games")) limitConfig = RateLimits.game
    if (nextUrl.pathname.includes("/payments/deposit")) limitConfig = RateLimits.deposit
    if (nextUrl.pathname.includes("/payments/withdraw")) limitConfig = RateLimits.withdrawal
    if (nextUrl.pathname.includes("/auth")) limitConfig = RateLimits.auth // Catch-all for other auth
    if (nextUrl.pathname.includes("/auth/login")) limitConfig = RateLimits.login
    if (nextUrl.pathname.includes("/auth/register")) limitConfig = RateLimits.register

    const rateLimit = await rateLimitMiddleware(req, limitConfig)
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit, limitConfig.max)
    }
  }

  // 2. Auth Cookie Check (NextAuth OR custom auth cookie)
  const hasAuthCookie = req.cookies.has("auth_session") || req.cookies.has("next-auth.session-token") || req.cookies.has("__Secure-next-auth.session-token")
  const hasAuth = isLoggedIn || hasAuthCookie

  const isAuthPage = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register")

  // Protect sensitive dashboard/admin routes if no auth cookie or session
  if (!hasAuth && (nextUrl.pathname.startsWith("/dashboard") || nextUrl.pathname.startsWith("/admin"))) {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }

  return NextResponse.next()
})

// Configure middleware for specific paths
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}

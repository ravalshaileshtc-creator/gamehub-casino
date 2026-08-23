import type { NextAuthConfig } from "next-auth"

// This file must be Edge-compatible (no Prisma)
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [], // Providers are defined in auth.ts to avoid Edge Runtime issues with Prisma
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard')
      if (isOnDashboard) {
        if (isLoggedIn) return true
        return false // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        // return Response.redirect(new URL('/dashboard', nextUrl))
      }
      return true
    },
    // JWT callback is safe if it doesn't use Prisma
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role
        token.sub = user.id
        token.vipLevel = user.vipLevel
      }

      // Update session
      if (trigger === "update" && session) {
        token = { ...token, ...session }
      }

      return token
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub
      }
      if (token.role && session.user) {
        session.user.role = token.role as "USER" | "ADMIN"
      }
      if (token.vipLevel && session.user) {
        session.user.vipLevel = token.vipLevel
      }
      return session
    }
  }
} satisfies NextAuthConfig

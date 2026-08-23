import { DefaultSession, DefaultUser } from "next-auth"
import { DefaultJWT } from "next-auth/jwt"
import { UserRole } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
      vipLevel: string
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    role: UserRole
    vipLevel?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role: UserRole
    vipLevel?: string | null
  }
}

declare module "@auth/core/adapters" {
  interface AdapterUser extends DefaultUser {
    role: UserRole
    vipLevel?: string | null
  }
}

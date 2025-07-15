import NextAuth, { NextAuthOptions, Session, User } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

import bcrypt from "bcrypt"
import { JWT } from "next-auth/jwt"

import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.utilisateur.findUnique({
          where: { email: credentials.email },
        })

        if (!user) return null

        const isValid = await bcrypt.compare(credentials.password, user.motDePasse)
        if (!isValid) return null

        return {
          id: user.id.toString(),
          name: user.nom,
          email: user.email,
        }
      },
    }),
  ],

  session: { strategy: "jwt" as const },

  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User | null }): Promise<JWT> {
      if (user) {
        token.id = user.id.toString()
      }
      return token
    },

    async session({
      session,
      token,
    }: {
      session: Session
      token: JWT
    }): Promise<Session> {
      if (token?.id) {
        const userInDb = await prisma.utilisateur.findUnique({
          where: { id: parseInt(token.id as string) },
        })

        if (userInDb) {
          session.user = {
            name: userInDb.nom,
            email: userInDb.email,
          }
        }
      }

      return session
    },
  },

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)

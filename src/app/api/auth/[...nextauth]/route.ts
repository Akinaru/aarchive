import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { JWT } from "next-auth/jwt";

const prisma = new PrismaClient();

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
    authorize: async (credentials) => {
    if (!credentials?.email || !credentials?.password) {
        return null;
    }

    const user = await prisma.user.findUnique({
        where: { email: credentials.email },
    });

    if (!user) return null;

    const isValid = await bcrypt.compare(credentials.password, user.password);
    if (!isValid) return null;

    return {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
    };
    }


    }),
  ],
session: { strategy: "jwt" as const },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: any }): Promise<JWT> {
      if (user) {
        token.id = user.id.toString();
      }
      return token;
    },
    async session({ session, token }: {
      session: any;
      token: JWT;
    }): Promise<any> {
      if (token?.id) {
        session.user.id = token.id;
      }
      return session;
    },
  },

  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

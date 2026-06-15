import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const ALLOWED_EMAIL     = process.env.ALLOWED_EMAIL     ?? "ginopattiweb@gmail.com";
const LOGIN_PASSWORD    = process.env.LOGIN_PASSWORD;
const EMPLOYEE_EMAIL    = process.env.EMPLOYEE_EMAIL;
const EMPLOYEE_PASSWORD = process.env.EMPLOYEE_PASSWORD;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Owner
        if (
          credentials.email.toLowerCase() === ALLOWED_EMAIL.toLowerCase() &&
          LOGIN_PASSWORD &&
          credentials.password === LOGIN_PASSWORD
        ) {
          return { id: "owner", email: ALLOWED_EMAIL, name: "Gino Patti", role: "owner" };
        }

        // Employee
        if (
          EMPLOYEE_EMAIL && EMPLOYEE_PASSWORD &&
          credentials.email.toLowerCase() === EMPLOYEE_EMAIL.toLowerCase() &&
          credentials.password === EMPLOYEE_PASSWORD
        ) {
          return { id: "employee", email: EMPLOYEE_EMAIL, name: "Empleado", role: "employee" };
        }

        // Client portal user
        const clientUser = await prisma.clientUser.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: { client: { select: { id: true, name: true } } },
        });
        if (clientUser && await bcrypt.compare(credentials.password, clientUser.password)) {
          return {
            id: clientUser.id,
            email: clientUser.email,
            name: clientUser.client.name,
            role: "client",
            clientId: clientUser.clientId,
          };
        }

        return null;
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email    = user.email;
        token.role     = (user as { role?: string }).role as "owner" | "employee" | "client" ?? "employee";
        token.clientId = (user as { clientId?: string }).clientId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email    = token.email as string;
        session.user.id       = token.sub ?? "owner";
        session.user.role     = token.role ?? "employee";
        session.user.clientId = token.clientId as string | undefined;
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
};

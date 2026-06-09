import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

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

        return null;
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.role = (user as { role?: string }).role as "owner" | "employee" ?? "employee";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.id    = token.sub ?? "owner";
        session.user.role  = token.role ?? "employee";
      }
      return session;
    },
  },
  pages: { signIn: "/login" },
};

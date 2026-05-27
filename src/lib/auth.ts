import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const ALLOWED_EMAIL   = process.env.ALLOWED_EMAIL   ?? "ginopattiweb@gmail.com";
const LOGIN_PASSWORD  = process.env.LOGIN_PASSWORD;

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
        if (credentials.email.toLowerCase() !== ALLOWED_EMAIL.toLowerCase()) return null;
        if (!LOGIN_PASSWORD || credentials.password !== LOGIN_PASSWORD) return null;
        return { id: "owner", email: ALLOWED_EMAIL, name: "Gino Patti" };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.email = user.email;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.id = token.sub ?? "owner";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "owner" | "employee" | "client";
      clientId?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "owner" | "employee" | "client";
    clientId?: string;
  }
}

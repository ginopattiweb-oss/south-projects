import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "client" || !session.user.clientId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await prisma.client.findUnique({
    where: { id: session.user.clientId },
    include: {
      projects: {
        orderBy: { createdAt: "desc" },
        include: {
          tasks: { orderBy: { createdAt: "desc" } },
          invoices: { orderBy: { createdAt: "desc" } },
        },
      },
    },
  });

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(client);
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clients = await prisma.client.findMany({
    include: { projects: { select: { id: true } }, invoices: { select: { id: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const client = await prisma.client.create({
    data: {
      name: body.name,
      status: body.status ?? "LEAD",
      contactEmail: body.contactEmail ?? null,
      currency: body.currency ?? "USD",
      logoUrl: body.logoUrl ?? null,
      notes: body.notes ?? null,
    },
  });

  return NextResponse.json(client, { status: 201 });
}

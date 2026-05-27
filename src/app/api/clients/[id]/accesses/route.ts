import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const accesses = await prisma.clientAccess.findMany({
    where: { clientId: id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(accesses);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const access = await prisma.clientAccess.create({
    data: {
      clientId: id,
      service: body.service,
      username: body.username ?? null,
      password: body.password ?? null,
      notes: body.notes ?? null,
    },
  });
  return NextResponse.json(access, { status: 201 });
}

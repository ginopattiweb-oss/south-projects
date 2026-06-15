import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "owner") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await prisma.clientUser.findMany({
    include: { client: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "owner") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.email || !body.password || !body.clientId) {
    return NextResponse.json({ error: "email, password, clientId requeridos" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(body.password, 12);
  const user = await prisma.clientUser.create({
    data: { email: body.email.toLowerCase(), password: hashed, clientId: body.clientId },
    include: { client: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ id: user.id, email: user.email, clientId: user.clientId, client: user.client }, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "owner") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const data: { password?: string } = {};
  if (body.password) data.password = await bcrypt.hash(body.password, 12);

  const user = await prisma.clientUser.update({ where: { id }, data });
  return NextResponse.json({ id: user.id, email: user.email });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "owner") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.clientUser.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

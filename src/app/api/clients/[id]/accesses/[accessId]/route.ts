import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ accessId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { accessId } = await params;
  const body = await req.json();

  const access = await prisma.clientAccess.update({
    where: { id: accessId },
    data: {
      ...(body.service !== undefined && { service: body.service }),
      ...(body.username !== undefined && { username: body.username }),
      ...(body.password !== undefined && { password: body.password }),
      ...(body.notes !== undefined && { notes: body.notes }),
    },
  });
  return NextResponse.json(access);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ accessId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { accessId } = await params;
  await prisma.clientAccess.delete({ where: { id: accessId } });
  return NextResponse.json({ ok: true });
}

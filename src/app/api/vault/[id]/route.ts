import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    const entry = await prisma.agencyVault.update({ where: { id }, data: body });
    return NextResponse.json(entry);
  } catch (err) {
    console.error("[vault PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    await prisma.agencyVault.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[vault DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

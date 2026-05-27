import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const sub = await prisma.subscription.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.amount !== undefined && { amount: Number(body.amount) }),
      ...(body.billingCycle !== undefined && { billingCycle: body.billingCycle }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.url !== undefined && { url: body.url }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.renewsAt !== undefined && { renewsAt: body.renewsAt ? new Date(body.renewsAt) : null }),
    },
  });

  return NextResponse.json(sub);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.subscription.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

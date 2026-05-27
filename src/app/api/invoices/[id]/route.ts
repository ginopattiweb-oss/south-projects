import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const invoice = await prisma.invoice.update({
    where: { id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.clientId !== undefined && { clientId: body.clientId }),
      ...(body.projectId !== undefined && { projectId: body.projectId || null }),
      ...(body.amount !== undefined && { amount: Number(body.amount) }),
      ...(body.currency !== undefined && { currency: body.currency }),
      ...(body.invoiceUrl !== undefined && { invoiceUrl: body.invoiceUrl }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
    },
    include: {
      client: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(invoice);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.invoice.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

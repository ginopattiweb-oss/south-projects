import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const expense = await prisma.expense.update({
    where: { id },
    data: {
      ...(body.description !== undefined && { description: body.description }),
      ...(body.amount !== undefined && { amount: Number(body.amount) }),
      ...(body.date !== undefined && { date: new Date(body.date) }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.receiptUrl !== undefined && { receiptUrl: body.receiptUrl }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.projectId !== undefined && { projectId: body.projectId || null }),
    },
    include: { project: { select: { id: true, name: true } } },
  });

  return NextResponse.json(expense);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

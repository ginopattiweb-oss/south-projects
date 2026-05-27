import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const expenses = await prisma.expense.findMany({
    include: { project: { select: { id: true, name: true } } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const expense = await prisma.expense.create({
    data: {
      description: body.description,
      amount: Number(body.amount) || 0,
      date: body.date ? new Date(body.date) : new Date(),
      category: body.category ?? null,
      receiptUrl: body.receiptUrl ?? null,
      notes: body.notes ?? null,
      projectId: body.projectId || null,
    },
    include: { project: { select: { id: true, name: true } } },
  });

  return NextResponse.json(expense, { status: 201 });
}

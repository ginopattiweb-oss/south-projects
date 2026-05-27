import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tasks = await prisma.task.findMany({
    include: { project: { select: { id: true, name: true, client: { select: { id: true, name: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const task = await prisma.task.create({
    data: {
      title: body.title,
      status: body.status ?? "READY",
      projectId: body.projectId,
      description: body.description ?? null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    },
    include: { project: { select: { id: true, name: true, client: { select: { id: true, name: true } } } } },
  });

  return NextResponse.json(task, { status: 201 });
}

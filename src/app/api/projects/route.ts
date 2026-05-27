import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({
    include: {
      client: { select: { id: true, name: true } },
      tasks: { select: { id: true } },
      invoices: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const project = await prisma.project.create({
    data: {
      name: body.name,
      status: body.status ?? "NOT_STARTED",
      clientId: body.clientId,
      description: body.description ?? null,
    },
    include: { client: { select: { id: true, name: true } }, tasks: { select: { id: true } } },
  });

  return NextResponse.json(project, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      client: { include: { accesses: true } },
      tasks: { orderBy: { createdAt: "asc" } },
      invoices: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.clientId !== undefined && { clientId: body.clientId }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.attachments !== undefined && { attachments: body.attachments }),
      ...(body.quickLinks !== undefined && { quickLinks: body.quickLinks }),
      ...(body.contactName !== undefined && { contactName: body.contactName }),
      ...(body.contactEmail !== undefined && { contactEmail: body.contactEmail }),
      ...(body.contactWhatsapp !== undefined && { contactWhatsapp: body.contactWhatsapp }),
      ...(body.documents !== undefined && { documents: body.documents }),
      ...(body.projectFiles !== undefined && { projectFiles: body.projectFiles }),
    },
    include: { client: { select: { id: true, name: true } }, tasks: { select: { id: true } } },
  });

  return NextResponse.json(project);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

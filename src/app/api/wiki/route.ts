import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pages = await prisma.wikiPage.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, slug: true, parentId: true, updatedAt: true },
  });

  return NextResponse.json(pages);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const title = (body.title as string)?.trim() || "Sin título";
  const slug = title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now();

  const page = await prisma.wikiPage.create({
    data: {
      title,
      slug,
      content: body.content ?? "",
      parentId: body.parentId ?? null,
    },
  });

  return NextResponse.json(page, { status: 201 });
}

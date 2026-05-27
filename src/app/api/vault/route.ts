import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const entries = await prisma.agencyVault.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(entries);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[vault GET]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const entry = await prisma.agencyVault.create({
      data: {
        service:  body.service,
        username: body.username  ?? null,
        password: body.password  ?? null,
        url:      body.url       ?? null,
        notes:    body.notes     ?? null,
        category: body.category  ?? null,
      },
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (err) {
    console.error("[vault POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

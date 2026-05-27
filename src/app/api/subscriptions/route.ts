import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subscriptions = await prisma.subscription.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(subscriptions);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const sub = await prisma.subscription.create({
    data: {
      name: body.name,
      amount: Number(body.amount) || 0,
      billingCycle: body.billingCycle ?? "MONTHLY",
      status: body.status ?? "ACTIVE",
      url: body.url ?? null,
      notes: body.notes ?? null,
      renewsAt: body.renewsAt ? new Date(body.renewsAt) : null,
    },
  });

  return NextResponse.json(sub, { status: 201 });
}

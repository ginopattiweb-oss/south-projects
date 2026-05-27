import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [clients, projects, tasks, invoices, subscriptions, expenses, wiki] = await Promise.all([
    prisma.client.findMany({ include: { projects: true, invoices: true } }),
    prisma.project.findMany({ include: { client: true, tasks: true } }),
    prisma.task.findMany({ include: { project: true } }),
    prisma.invoice.findMany({ include: { client: true, project: true } }),
    prisma.subscription.findMany(),
    prisma.expense.findMany(),
    prisma.wikiPage.findMany(),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    studio: "SOUTH PROJECTS",
    data: { clients, projects, tasks, invoices, subscriptions, expenses, wiki },
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="south-projects-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}

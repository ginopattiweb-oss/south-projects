import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { anthropic, MODEL } from "@/lib/anthropic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId, projectScope, budget } = await req.json();
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      projects: { include: { tasks: { select: { id: true, status: true } } } },
      invoices: { where: { status: "PAID" }, select: { amount: true, currency: true } },
    },
  });

  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const totalPaid = client.invoices.reduce((sum, i) => sum + i.amount, 0);
  const completedProjects = client.projects.filter((p) => p.status === "DONE").length;

  const prompt = `You are writing a professional project proposal on behalf of SOUTH PROJECTS, a design/creative studio run by Gino Patti.

CLIENT CONTEXT:
- Name: ${client.name}
- Status: ${client.status}
- Currency: ${client.currency}
- Total historical billing: $${totalPaid.toFixed(2)}
- Past projects: ${client.projects.length} (${completedProjects} completed)
- Notes: ${client.notes ?? "None"}

NEW PROJECT SCOPE:
${projectScope ?? "General creative/design services"}

${budget ? `Budget Range: ${budget}` : ""}

Write a professional project proposal (600-800 words) including:
1. **Executive Summary** — what SOUTH PROJECTS will deliver and why
2. **Scope of Work** — 4-6 specific deliverables
3. **Timeline** — realistic milestone breakdown (3-4 phases)
4. **Investment** — pricing rationale${budget ? ` within the ${budget} range` : ""}
5. **Next Steps** — clear call to action

Tone: confident, direct, premium. No filler phrases. Use the client's history to personalize.`;

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  return NextResponse.json({ proposal: text, clientName: client.name });
}

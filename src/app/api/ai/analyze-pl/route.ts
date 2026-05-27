import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { anthropic, MODEL } from "@/lib/anthropic";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [invoices, expenses, subscriptions] = await Promise.all([
    prisma.invoice.findMany({ include: { client: { select: { name: true } } }, orderBy: { createdAt: "asc" } }),
    prisma.expense.findMany({ orderBy: { date: "asc" } }),
    prisma.subscription.findMany({ where: { status: "ACTIVE" } }),
  ]);

  const monthlyBurn = subscriptions.reduce(
    (sum, s) => sum + (s.billingCycle === "MONTHLY" ? s.amount : s.amount / 12),
    0
  );

  const paidRevenue = invoices.filter((i) => i.status === "PAID").reduce((sum, i) => sum + i.amount, 0);
  const pendingRevenue = invoices.filter((i) => i.status === "PENDING").reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Group invoices by month
  const revenueByMonth: Record<string, number> = {};
  for (const inv of invoices.filter((i) => i.status === "PAID")) {
    const key = new Date(inv.createdAt).toISOString().slice(0, 7);
    revenueByMonth[key] = (revenueByMonth[key] ?? 0) + inv.amount;
  }

  const expensesByMonth: Record<string, number> = {};
  for (const exp of expenses) {
    const key = new Date(exp.date).toISOString().slice(0, 7);
    expensesByMonth[key] = (expensesByMonth[key] ?? 0) + exp.amount;
  }

  const expensesByCategory: Record<string, number> = {};
  for (const exp of expenses) {
    const cat = exp.category ?? "Uncategorized";
    expensesByCategory[cat] = (expensesByCategory[cat] ?? 0) + exp.amount;
  }

  const prompt = `You are a financial analyst reviewing the P&L data for SOUTH PROJECTS, a design/creative studio run by Gino Patti.

FINANCIAL SUMMARY:
- Total Paid Revenue: $${paidRevenue.toFixed(2)}
- Pending Revenue: $${pendingRevenue.toFixed(2)}
- Total Expenses: $${totalExpenses.toFixed(2)}
- Monthly Subscription Burn: $${monthlyBurn.toFixed(2)}/mo
- Net Profit (paid - expenses): $${(paidRevenue - totalExpenses).toFixed(2)}

REVENUE BY MONTH:
${Object.entries(revenueByMonth).sort().map(([m, v]) => `${m}: $${v.toFixed(2)}`).join("\n") || "No data"}

EXPENSES BY MONTH:
${Object.entries(expensesByMonth).sort().map(([m, v]) => `${m}: $${v.toFixed(2)}`).join("\n") || "No data"}

EXPENSES BY CATEGORY:
${Object.entries(expensesByCategory).map(([c, v]) => `${c}: $${v.toFixed(2)}`).join("\n") || "No data"}

INVOICE BREAKDOWN:
- Total invoices: ${invoices.length}
- Paid: ${invoices.filter((i) => i.status === "PAID").length}
- Pending: ${invoices.filter((i) => i.status === "PENDING").length}
- Draft: ${invoices.filter((i) => i.status === "DRAFT").length}
- Canceled: ${invoices.filter((i) => i.status === "CANCELED").length}

Provide a concise, data-forward P&L analysis (max 400 words). Cover:
1. Revenue health and trend
2. Expense analysis and notable categories
3. Profit margin assessment
4. 2-3 specific, actionable recommendations
Be direct and use actual numbers. Format with clear sections.`;

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  return NextResponse.json({ analysis: text });
}

import { PrismaClient } from "../src/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import "dotenv/config";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function main() {
  console.log("Seeding SOUTH PROJECTS...");

  // Clients
  const acme = await prisma.client.create({
    data: {
      name: "Acme Studio",
      status: "ACTIVE",
      contactEmail: "studio@acme.co",
      currency: "USD",
      notes: "Long-term branding client. Pays on time.",
    },
  });

  const vanta = await prisma.client.create({
    data: {
      name: "Vanta Labs",
      status: "ACTIVE",
      contactEmail: "hello@vantalabs.io",
      currency: "USD",
      notes: "Tech startup. Fast-moving, high budget.",
    },
  });

  const prospect = await prisma.client.create({
    data: {
      name: "Meridian Co",
      status: "LEAD",
      contactEmail: "founders@meridian.co",
      currency: "USD",
    },
  });

  // Projects
  const brandProject = await prisma.project.create({
    data: {
      name: "Brand Identity Refresh",
      status: "ON_TRACK",
      clientId: acme.id,
      description: "Full brand identity overhaul — logo, type, color, guidelines.",
    },
  });

  const webProject = await prisma.project.create({
    data: {
      name: "Marketing Site v2",
      status: "PLANNING",
      clientId: vanta.id,
      description: "Redesign and rebuild of main marketing website.",
    },
  });

  const deckProject = await prisma.project.create({
    data: {
      name: "Investor Deck Design",
      status: "DONE",
      clientId: vanta.id,
      description: "Series A pitch deck — 18 slides.",
    },
  });

  // Tasks
  await prisma.task.createMany({
    data: [
      { title: "Logo exploration", status: "DONE", projectId: brandProject.id },
      { title: "Typography selection", status: "IN_PROGRESS", projectId: brandProject.id, dueDate: new Date("2026-06-01") },
      { title: "Color palette", status: "READY", projectId: brandProject.id, dueDate: new Date("2026-06-15") },
      { title: "Brand guidelines PDF", status: "READY", projectId: brandProject.id },
      { title: "Wireframes", status: "IN_PROGRESS", projectId: webProject.id, dueDate: new Date("2026-05-20") },
      { title: "Design system setup", status: "READY", projectId: webProject.id },
      { title: "Homepage design", status: "READY", projectId: webProject.id },
      { title: "Deck slides 1-9", status: "DONE", projectId: deckProject.id },
      { title: "Deck slides 10-18", status: "DONE", projectId: deckProject.id },
    ],
  });

  // Invoices
  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2026-0001",
      status: "PAID",
      clientId: acme.id,
      projectId: brandProject.id,
      amount: 4500,
      currency: "USD",
      notes: "50% deposit — Brand Identity Refresh",
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2026-0002",
      status: "PAID",
      clientId: vanta.id,
      projectId: deckProject.id,
      amount: 3200,
      currency: "USD",
      notes: "Investor Deck — final delivery",
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2026-0003",
      status: "PENDING",
      clientId: acme.id,
      projectId: brandProject.id,
      amount: 4500,
      currency: "USD",
      dueDate: new Date("2026-06-01"),
      notes: "50% final payment — Brand Identity Refresh",
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2026-0004",
      status: "DRAFT",
      clientId: vanta.id,
      projectId: webProject.id,
      amount: 8000,
      currency: "USD",
      notes: "Marketing Site v2 — Phase 1",
    },
  });

  // Subscriptions
  await prisma.subscription.createMany({
    data: [
      { name: "Figma", amount: 45, billingCycle: "MONTHLY", status: "ACTIVE", url: "https://figma.com" },
      { name: "Vercel Pro", amount: 20, billingCycle: "MONTHLY", status: "ACTIVE", url: "https://vercel.com" },
      { name: "Adobe CC", amount: 599, billingCycle: "ANNUAL", status: "ACTIVE", url: "https://adobe.com" },
      { name: "Notion", amount: 16, billingCycle: "MONTHLY", status: "ACTIVE" },
      { name: "Linear", amount: 8, billingCycle: "MONTHLY", status: "ACTIVE" },
      { name: "Loom", amount: 12, billingCycle: "MONTHLY", status: "PAUSED" },
    ],
  });

  // Expenses
  await prisma.expense.createMany({
    data: [
      { description: "Stock photo license", amount: 49, date: new Date("2026-05-02"), category: "Software" },
      { description: "iPad Pro + Pencil", amount: 1299, date: new Date("2026-04-15"), category: "Hardware" },
      { description: "Client dinner — Acme", amount: 187, date: new Date("2026-05-10"), category: "Other" },
      { description: "Font license — Neue Haas", amount: 220, date: new Date("2026-03-22"), category: "Software" },
      { description: "External SSD 2TB", amount: 129, date: new Date("2026-04-01"), category: "Hardware" },
      { description: "Co-working day pass", amount: 35, date: new Date("2026-05-14"), category: "Office" },
    ],
  });

  // Wiki
  await prisma.wikiPage.create({
    data: {
      title: "Getting Started",
      slug: "getting-started",
      content: "# SOUTH PROJECTS OS\n\nThis is your private business operating system.\n\n## Modules\n- **Clients** — Manage leads and active clients\n- **Projects** — Track project status and deliverables\n- **Tasks** — Task board with kanban view\n- **Invoices** — Billing with INV- prefix numbering\n- **Subscriptions** — Track recurring costs\n- **Expenses** — Log and categorize expenses\n\n## AI Tools\nAvailable from the Dashboard:\n- **P&L Analysis** — Claude analyzes revenue vs expenses\n- **Proposal Draft** — Generate client proposals from data",
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

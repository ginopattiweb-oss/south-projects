"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Brain, Download, Loader2, Users, FolderKanban, FileText, Receipt, TrendingUp, RefreshCw, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared";
import { formatCurrency, formatDate } from "@/lib/utils-format";

type Stats = {
  clients: { total: number; active: number; leads: number };
  projects: { total: number; active: number; behind: number };
  tasks: { total: number; inProgress: number; overdue: number };
  invoices: { total: number; pending: number; pendingAmount: number; paidThisMonth: number };
  expenses: { thisMonth: number; allTime: number };
  subscriptions: { monthlyBurn: number; active: number };
};

type RecentItem = {
  id: string; type: string; title: string; subtitle: string; status?: string; href: string; date: string;
};

type CalendarEvent = {
  id: string;
  summary?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [proposal, setProposal] = useState("");
  const [proposalLoading, setProposalLoading] = useState(false);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [proposalScope, setProposalScope] = useState("");
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [clientRes, projRes, taskRes, invRes, expRes, subRes] = await Promise.all([
      fetch("/api/clients"), fetch("/api/projects"), fetch("/api/tasks"),
      fetch("/api/invoices"), fetch("/api/expenses"), fetch("/api/subscriptions"),
    ]);

    const [clientData, projData, taskData, invData, expData, subData] = await Promise.all([
      clientRes.json(), projRes.json(), taskRes.json(),
      invRes.json(), expRes.json(), subRes.json(),
    ]);

    setClients(clientData);

    const now = new Date();
    const thisMonth = (d: string) => {
      const date = new Date(d);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    };

    const activeSubs = subData.filter((s: { status: string }) => s.status === "ACTIVE");
    const monthlyBurn = activeSubs.reduce(
      (sum: number, s: { amount: number; billingCycle: string }) =>
        sum + (s.billingCycle === "MONTHLY" ? s.amount : s.amount / 12),
      0
    );

    setStats({
      clients: {
        total: clientData.length,
        active: clientData.filter((c: { status: string }) => c.status === "ACTIVE").length,
        leads: clientData.filter((c: { status: string }) => c.status === "LEAD").length,
      },
      projects: {
        total: projData.length,
        active: projData.filter((p: { status: string }) => ["PLANNING", "ON_TRACK", "BEHIND"].includes(p.status)).length,
        behind: projData.filter((p: { status: string }) => p.status === "BEHIND").length,
      },
      tasks: {
        total: taskData.length,
        inProgress: taskData.filter((t: { status: string }) => t.status === "IN_PROGRESS").length,
        overdue: taskData.filter((t: { status: string; dueDate: string | null }) =>
          t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE"
        ).length,
      },
      invoices: {
        total: invData.length,
        pending: invData.filter((i: { status: string }) => i.status === "PENDING").length,
        pendingAmount: invData.filter((i: { status: string }) => i.status === "PENDING").reduce((sum: number, i: { amount: number }) => sum + i.amount, 0),
        paidThisMonth: invData.filter((i: { status: string; dueDate: string | null; createdAt: string }) => i.status === "PAID" && thisMonth(i.dueDate ?? i.createdAt)).reduce((sum: number, i: { amount: number }) => sum + i.amount, 0),
      },
      expenses: {
        thisMonth: expData.filter((e: { date: string }) => thisMonth(e.date)).reduce((sum: number, e: { amount: number }) => sum + e.amount, 0),
        allTime: expData.reduce((sum: number, e: { amount: number }) => sum + e.amount, 0),
      },
      subscriptions: { monthlyBurn, active: activeSubs.length },
    });

    // Recent items
    const recentItems: RecentItem[] = [
      ...invData.slice(0, 3).map((i: { id: string; invoiceNumber: string; status: string; amount: number; currency: string; createdAt: string }) => ({
        id: i.id, type: "Factura", title: i.invoiceNumber,
        subtitle: formatCurrency(i.amount, i.currency), status: i.status,
        href: "/invoices", date: i.createdAt,
      })),
      ...projData.slice(0, 3).map((p: { id: string; name: string; status: string; client?: { name: string }; createdAt: string }) => ({
        id: p.id, type: "Proyecto", title: p.name,
        subtitle: p.client?.name ?? "—", status: p.status,
        href: "/projects", date: p.createdAt,
      })),
      ...taskData.filter((t: { status: string }) => t.status === "IN_PROGRESS").slice(0, 3).map((t: { id: string; title: string; status: string; project?: { name: string }; createdAt: string }) => ({
        id: t.id, type: "Tarea", title: t.title,
        subtitle: t.project?.name ?? "—", status: t.status,
        href: "/tasks", date: t.createdAt,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

    setRecent(recentItems);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    async function loadCalendar() {
      setCalendarLoading(true);
      try {
        const res = await fetch("/api/calendar/events");
        if (!res.ok) {
          const err = await res.json();
          setCalendarError(err.error ?? "Failed to load calendar");
        } else {
          setCalendarEvents(await res.json());
          setCalendarError(null);
        }
      } catch {
        setCalendarError("Failed to connect");
      }
      setCalendarLoading(false);
    }
    loadCalendar();
  }, []);

  async function runPLAnalysis() {
    setAiLoading(true);
    setAiAnalysis("");
    try {
      const res = await fetch("/api/ai/analyze-pl", { method: "POST" });
      const data = await res.json();
      if (data.analysis) setAiAnalysis(data.analysis);
      else toast.error("Error en el análisis");
    } catch {
      toast.error("Error al conectar con la IA");
    }
    setAiLoading(false);
  }

  async function runProposal() {
    if (!selectedClientId) return toast.error("Seleccioná un cliente primero");
    setProposalLoading(true);
    setProposal("");
    try {
      const res = await fetch("/api/ai/draft-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: selectedClientId, projectScope: proposalScope }),
      });
      const data = await res.json();
      if (data.proposal) setProposal(data.proposal);
      else toast.error("Error al generar propuesta");
    } catch {
      toast.error("Error al conectar con la IA");
    }
    setProposalLoading(false);
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground text-xs">
        <Loader2 className="size-3.5 animate-spin" /> Cargando...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold">Panel</h1>
          <p className="text-xs text-muted-foreground">SOUTH PROJECTS — Gino Patti</p>
        </div>
        <a
          href="/api/export"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-card-elevated transition-colors"
        >
          <Download className="size-3.5" />
          Exportar JSON
        </a>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard
            icon={<Users className="size-4 text-[#0070F3]" />}
            label="Clientes"
            value={stats.clients.total}
            sub={`${stats.clients.active} activos · ${stats.clients.leads} leads`}
            href="/clients"
          />
          <StatCard
            icon={<FolderKanban className="size-4 text-purple-400" />}
            label="Proyectos"
            value={stats.projects.total}
            sub={`${stats.projects.active} activos${stats.projects.behind > 0 ? ` · ${stats.projects.behind} atrasados` : ""}`}
            href="/projects"
            alert={stats.projects.behind > 0}
          />
          <StatCard
            icon={<FileText className="size-4 text-amber-400" />}
            label="Facturas"
            value={`${formatCurrency(stats.invoices.paidThisMonth)}`}
            sub={`${stats.invoices.pending} pendientes · ${formatCurrency(stats.invoices.pendingAmount)}`}
            href="/invoices"
          />
          <StatCard
            icon={<TrendingUp className="size-4 text-emerald-400" />}
            label="Ingresos del Mes"
            value={formatCurrency(stats.invoices.paidThisMonth)}
            sub={`Neto: ${formatCurrency(stats.invoices.paidThisMonth - stats.expenses.thisMonth)}`}
            href="/invoices"
          />
          <StatCard
            icon={<Receipt className="size-4 text-red-400" />}
            label="Gastos"
            value={formatCurrency(stats.expenses.thisMonth)}
            sub={`Este mes · Total: ${formatCurrency(stats.expenses.allTime)}`}
            href="/expenses"
          />
          <StatCard
            icon={<RefreshCw className="size-4 text-zinc-400" />}
            label="Burn Mensual"
            value={formatCurrency(stats.subscriptions.monthlyBurn)}
            sub={`${stats.subscriptions.active} suscripciones activas`}
            href="/subscriptions"
          />
        </div>
      )}

      {/* Google Calendar */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-3.5 text-[#0070F3]" />
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Próximos — 14 Días</h2>
        </div>
        <div className="rounded-md border border-border overflow-hidden">
          {calendarLoading ? (
            <div className="flex items-center gap-2 p-3 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> Cargando calendario...
            </div>
          ) : calendarError ? (
            <p className="p-3 text-xs text-muted-foreground">{calendarError}</p>
          ) : calendarEvents.length === 0 ? (
            <p className="p-3 text-xs text-muted-foreground">Sin eventos próximos.</p>
          ) : (
            <div className="divide-y divide-border">
              {calendarEvents.map((ev) => {
                const start = ev.start.dateTime ?? ev.start.date ?? "";
                const isAllDay = !ev.start.dateTime;
                const date = new Date(start);
                const label = isAllDay
                  ? date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
                  : date.toLocaleDateString("es-AR", { weekday: "short", month: "short", day: "numeric" }) +
                    " · " +
                    date.toLocaleTimeString("es-AR", { hour: "numeric", minute: "2-digit" });
                return (
                  <a
                    key={ev.id}
                    href={ev.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-3 py-2.5 hover:bg-card-elevated transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="size-1.5 rounded-full bg-[#0070F3] shrink-0" />
                      <span className="text-xs font-medium truncate">{ev.summary ?? "(sin título)"}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0 ml-2">{label}</span>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="space-y-2">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Actividad Reciente</h2>
          <div className="rounded-md border border-border overflow-hidden">
            {recent.length === 0 ? (
              <p className="text-xs text-muted-foreground p-4">Sin actividad aún.</p>
            ) : (
              recent.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="flex items-center justify-between px-3 py-2.5 border-b border-border last:border-0 hover:bg-card-elevated transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[10px] text-muted-foreground bg-card-elevated px-1.5 py-0.5 rounded shrink-0">
                      {item.type}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{item.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {item.status && <StatusBadge status={item.status} />}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* AI Tools */}
        <div className="space-y-4">
          {/* P&L Analysis */}
          <div className="space-y-2">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">IA — Análisis P&L</h2>
            <div className="rounded-md border border-border p-3 space-y-2">
              <p className="text-[11px] text-muted-foreground">Analiza facturas y gastos para producir insights financieros accionables.</p>
              <Button
                size="sm"
                onClick={runPLAnalysis}
                disabled={aiLoading}
                className="h-7 text-xs bg-[#0070F3] hover:bg-[#3385F5] text-white gap-1.5"
              >
                {aiLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Brain className="size-3.5" />}
                {aiLoading ? "Analizando..." : "Ejecutar Análisis P&L"}
              </Button>
              {aiAnalysis && (
                <div className="mt-3 p-3 bg-background rounded border border-border">
                  <pre className="text-[11px] text-foreground whitespace-pre-wrap leading-relaxed font-sans">
                    {aiAnalysis}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Proposal Draft */}
          <div className="space-y-2">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">IA — Borrador de Propuesta</h2>
            <div className="rounded-md border border-border p-3 space-y-2">
              <div className="space-y-1.5">
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full h-7 rounded border border-border bg-background px-2 text-xs text-foreground"
                >
                  <option value="">Seleccionar cliente...</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <textarea
                  value={proposalScope}
                  onChange={(e) => setProposalScope(e.target.value)}
                  placeholder="Describir el alcance del proyecto (opcional)..."
                  rows={2}
                  className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground resize-none"
                />
              </div>
              <Button
                size="sm"
                onClick={runProposal}
                disabled={proposalLoading || !selectedClientId}
                className="h-7 text-xs bg-[#0070F3] hover:bg-[#3385F5] text-white gap-1.5"
              >
                {proposalLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Brain className="size-3.5" />}
                {proposalLoading ? "Redactando..." : "Redactar Propuesta"}
              </Button>
              {proposal && (
                <div className="mt-3 p-3 bg-background rounded border border-border">
                  <div className="flex justify-end mb-2">
                    <button
                      onClick={() => { navigator.clipboard.writeText(proposal); toast.success("Copiado al portapapeles"); }}
                      className="text-[10px] text-muted-foreground hover:text-foreground"
                    >
                      Copiar
                    </button>
                  </div>
                  <pre className="text-[11px] text-foreground whitespace-pre-wrap leading-relaxed font-sans">
                    {proposal}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon, label, value, sub, href, alert,
}: {
  icon: React.ReactNode; label: string; value: string | number; sub: string; href: string; alert?: boolean;
}) {
  return (
    <Link href={href} className="group block rounded-md border border-border bg-card p-4 hover:bg-card-elevated transition-colors">
      <div className="flex items-center justify-between mb-2">
        {icon}
        {alert && <span className="size-1.5 rounded-full bg-red-400" />}
      </div>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
      <p className="text-[10px] text-zinc-600 mt-0.5">{sub}</p>
    </Link>
  );
}

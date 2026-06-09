"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Brain, Download, Loader2, Users, FolderKanban, FileText, Receipt, TrendingUp, RefreshCw, CalendarDays, ArrowUpRight, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared";
import { formatCurrency } from "@/lib/utils-format";

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
    try {
      const [clientRes, projRes, taskRes, invRes, expRes, subRes] = await Promise.all([
        fetch("/api/clients"), fetch("/api/projects"), fetch("/api/tasks"),
        fetch("/api/invoices"), fetch("/api/expenses"), fetch("/api/subscriptions"),
      ]);
      const [clientData, projData, taskData, invData, expData, subData] = await Promise.all([
        clientRes.json(), projRes.json(), taskRes.json(),
        invRes.json(), expRes.json(), subRes.json(),
      ]);
      if (!Array.isArray(clientData) || !Array.isArray(projData) || !Array.isArray(taskData) || !Array.isArray(invData) || !Array.isArray(expData) || !Array.isArray(subData)) return;

      setClients(clientData);
      const now = new Date();
      const thisMonth = (d: string) => {
        const date = new Date(d);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      };
      const activeSubs = subData.filter((s: { status: string }) => s.status === "ACTIVE");
      const monthlyBurn = activeSubs.reduce(
        (sum: number, s: { amount: number; billingCycle: string }) =>
          sum + (s.billingCycle === "MONTHLY" ? s.amount : s.amount / 12), 0
      );
      setStats({
        clients: { total: clientData.length, active: clientData.filter((c: { status: string }) => c.status === "ACTIVE").length, leads: clientData.filter((c: { status: string }) => c.status === "LEAD").length },
        projects: { total: projData.length, active: projData.filter((p: { status: string }) => ["PLANNING", "ON_TRACK", "BEHIND"].includes(p.status)).length, behind: projData.filter((p: { status: string }) => p.status === "BEHIND").length },
        tasks: { total: taskData.length, inProgress: taskData.filter((t: { status: string }) => t.status === "IN_PROGRESS").length, overdue: taskData.filter((t: { status: string; dueDate: string | null }) => t.dueDate && new Date(t.dueDate) < now && t.status !== "DONE").length },
        invoices: { total: invData.length, pending: invData.filter((i: { status: string }) => i.status === "PENDING").length, pendingAmount: invData.filter((i: { status: string }) => i.status === "PENDING").reduce((sum: number, i: { amount: number }) => sum + i.amount, 0), paidThisMonth: invData.filter((i: { status: string; dueDate: string | null; createdAt: string }) => i.status === "PAID" && thisMonth(i.dueDate ?? i.createdAt)).reduce((sum: number, i: { amount: number }) => sum + i.amount, 0) },
        expenses: { thisMonth: expData.filter((e: { date: string }) => thisMonth(e.date)).reduce((sum: number, e: { amount: number }) => sum + e.amount, 0), allTime: expData.reduce((sum: number, e: { amount: number }) => sum + e.amount, 0) },
        subscriptions: { monthlyBurn, active: activeSubs.length },
      });
      const recentItems: RecentItem[] = [
        ...invData.slice(0, 3).map((i: { id: string; invoiceNumber: string; status: string; amount: number; currency: string; createdAt: string }) => ({ id: i.id, type: "Factura", title: i.invoiceNumber, subtitle: formatCurrency(i.amount, i.currency), status: i.status, href: "/invoices", date: i.createdAt })),
        ...projData.slice(0, 3).map((p: { id: string; name: string; status: string; client?: { name: string }; createdAt: string }) => ({ id: p.id, type: "Proyecto", title: p.name, subtitle: p.client?.name ?? "—", status: p.status, href: "/projects", date: p.createdAt })),
        ...taskData.filter((t: { status: string }) => t.status === "IN_PROGRESS").slice(0, 3).map((t: { id: string; title: string; status: string; project?: { name: string }; createdAt: string }) => ({ id: t.id, type: "Tarea", title: t.title, subtitle: t.project?.name ?? "—", status: t.status, href: "/tasks", date: t.createdAt })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);
      setRecent(recentItems);
    } catch {
      // session missing or API error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    async function loadCalendar() {
      setCalendarLoading(true);
      try {
        const res = await fetch("/api/calendar/events");
        if (!res.ok) { const err = await res.json(); setCalendarError(err.error ?? "Failed"); }
        else { setCalendarEvents(await res.json()); setCalendarError(null); }
      } catch { setCalendarError("Failed to connect"); }
      setCalendarLoading(false);
    }
    loadCalendar();
  }, []);

  async function runPLAnalysis() {
    setAiLoading(true); setAiAnalysis("");
    try {
      const res = await fetch("/api/ai/analyze-pl", { method: "POST" });
      const data = await res.json();
      if (data.analysis) setAiAnalysis(data.analysis); else toast.error("Error en el análisis");
    } catch { toast.error("Error al conectar con la IA"); }
    setAiLoading(false);
  }

  async function runProposal() {
    if (!selectedClientId) return toast.error("Seleccioná un cliente primero");
    setProposalLoading(true); setProposal("");
    try {
      const res = await fetch("/api/ai/draft-proposal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientId: selectedClientId, projectScope: proposalScope }) });
      const data = await res.json();
      if (data.proposal) setProposal(data.proposal); else toast.error("Error al generar propuesta");
    } catch { toast.error("Error al conectar con la IA"); }
    setProposalLoading(false);
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <Loader2 className="size-3.5 animate-spin text-violet-400" /> Cargando...
        </div>
      </div>
    );
  }

  const net = stats ? stats.invoices.paidThisMonth - stats.expenses.thisMonth : 0;

  return (
    <div className="p-6 space-y-5 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Panel</h1>
          <p className="text-[11px] text-muted-foreground">SOUTH PROJECTS — Gino Patti</p>
        </div>
        <a
          href="/api/export"
          className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg glass text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <Download className="size-3" />
          Exportar
        </a>
      </div>

      {/* ── BENTO GRID ── */}
      {stats && (
        <div className="grid grid-cols-4 grid-rows-2 gap-3" style={{ height: "260px" }}>

          {/* HERO — Ingresos (col-span-2 row-span-2) */}
          <Link href="/finances"
            className="col-span-2 row-span-2 glass rounded-2xl p-6 flex flex-col justify-between group hover:border-violet-500/30 transition-all duration-200 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-transparent rounded-2xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-medium text-violet-400 uppercase tracking-widest">Ingresos del Mes</span>
                <ArrowUpRight className="size-3.5 text-violet-400/50 group-hover:text-violet-400 transition-colors" />
              </div>
              <TrendingUp className="size-5 text-violet-400 mt-2" />
            </div>
            <div className="relative">
              <p className="text-4xl font-bold text-gradient-violet tabular-nums leading-none">
                {formatCurrency(stats.invoices.paidThisMonth)}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Neto: <span className={net >= 0 ? "text-emerald-400" : "text-rose-400"}>{formatCurrency(net)}</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {stats.invoices.pending} facturas pendientes · {formatCurrency(stats.invoices.pendingAmount)}
              </p>
            </div>
          </Link>

          {/* Clientes */}
          <Link href="/clients" className="glass rounded-2xl p-4 flex flex-col justify-between group hover:border-violet-500/20 transition-all duration-200">
            <div className="flex items-center justify-between">
              <Users className="size-4 text-violet-400" />
              <ArrowUpRight className="size-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{stats.clients.total}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Clientes</p>
              <p className="text-[10px] text-muted-foreground mt-1">{stats.clients.active} activos · {stats.clients.leads} leads</p>
            </div>
          </Link>

          {/* Proyectos */}
          <Link href="/projects" className={`glass rounded-2xl p-4 flex flex-col justify-between group transition-all duration-200 ${stats.projects.behind > 0 ? "hover:border-rose-500/30" : "hover:border-violet-500/20"}`}>
            <div className="flex items-center justify-between">
              <FolderKanban className={`size-4 ${stats.projects.behind > 0 ? "text-rose-400" : "text-emerald-400"}`} />
              <ArrowUpRight className="size-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{stats.projects.total}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Proyectos</p>
              <p className={`text-[10px] mt-1 ${stats.projects.behind > 0 ? "text-rose-400" : "text-muted-foreground"}`}>
                {stats.projects.active} activos{stats.projects.behind > 0 ? ` · ${stats.projects.behind} atrasados` : ""}
              </p>
            </div>
          </Link>

          {/* Gastos */}
          <Link href="/expenses" className="glass rounded-2xl p-4 flex flex-col justify-between group hover:border-rose-500/20 transition-all duration-200">
            <div className="flex items-center justify-between">
              <Receipt className="size-4 text-rose-400" />
              <ArrowUpRight className="size-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
            </div>
            <div>
              <p className="text-xl font-bold tabular-nums text-rose-400">{formatCurrency(stats.expenses.thisMonth)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Gastos</p>
              <p className="text-[10px] text-muted-foreground mt-1">Total: {formatCurrency(stats.expenses.allTime)}</p>
            </div>
          </Link>

          {/* Burn Mensual */}
          <Link href="/subscriptions" className="glass rounded-2xl p-4 flex flex-col justify-between group hover:border-amber-500/20 transition-all duration-200">
            <div className="flex items-center justify-between">
              <RefreshCw className="size-4 text-amber-400" />
              <ArrowUpRight className="size-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
            </div>
            <div>
              <p className="text-xl font-bold tabular-nums text-amber-400">{formatCurrency(stats.subscriptions.monthlyBurn)}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Burn Mensual</p>
              <p className="text-[10px] text-muted-foreground mt-1">{stats.subscriptions.active} suscripciones</p>
            </div>
          </Link>

        </div>
      )}

      {/* ── SECOND ROW — Calendar + Facturas Pendientes ── */}
      <div className="grid grid-cols-3 gap-3">

        {/* Calendario */}
        <div className="col-span-2 glass rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
            <CalendarDays className="size-3.5 text-violet-400" />
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">Próximos 14 Días</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {calendarLoading ? (
              <div className="flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" /> Cargando...
              </div>
            ) : calendarError ? (
              <p className="px-4 py-3 text-xs text-muted-foreground">{calendarError}</p>
            ) : calendarEvents.length === 0 ? (
              <p className="px-4 py-3 text-xs text-muted-foreground">Sin eventos próximos.</p>
            ) : (
              calendarEvents.slice(0, 4).map((ev) => {
                const start = ev.start.dateTime ?? ev.start.date ?? "";
                const isAllDay = !ev.start.dateTime;
                const date = new Date(start);
                const label = isAllDay
                  ? date.toLocaleDateString("es-AR", { weekday: "short", month: "short", day: "numeric" })
                  : date.toLocaleDateString("es-AR", { weekday: "short", month: "short", day: "numeric" }) + " · " + date.toLocaleTimeString("es-AR", { hour: "numeric", minute: "2-digit" });
                return (
                  <a key={ev.id} href={ev.htmlLink} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.03] transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="size-1.5 rounded-full bg-violet-400 shrink-0" />
                      <span className="text-xs font-medium truncate">{ev.summary ?? "(sin título)"}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground shrink-0 ml-2">{label}</span>
                  </a>
                );
              })
            )}
          </div>
        </div>

        {/* Por Cobrar */}
        <Link href="/invoices" className="glass rounded-2xl p-5 flex flex-col justify-between group hover:border-amber-500/20 transition-all duration-200 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/8 via-transparent to-transparent rounded-2xl" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-amber-400" />
              <span className="text-[10px] font-medium text-amber-400 uppercase tracking-widest">Por Cobrar</span>
            </div>
            <ArrowUpRight className="size-3.5 text-muted-foreground/30 group-hover:text-amber-400 transition-colors" />
          </div>
          <div className="relative">
            <p className="text-3xl font-bold tabular-nums text-amber-400 leading-none">
              {formatCurrency(stats?.invoices.pendingAmount ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">{stats?.invoices.pending ?? 0} facturas pendientes</p>
          </div>
        </Link>

      </div>

      {/* ── THIRD ROW — Actividad + AI ── */}
      <div className="grid grid-cols-2 gap-3">

        {/* Actividad Reciente */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
            <FileText className="size-3.5 text-violet-400" />
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">Actividad Reciente</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {recent.length === 0 ? (
              <p className="text-xs text-muted-foreground px-4 py-3">Sin actividad aún.</p>
            ) : (
              recent.map((item) => (
                <Link key={item.id} href={item.href}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[9px] text-muted-foreground bg-white/[0.06] px-1.5 py-0.5 rounded-md shrink-0 uppercase tracking-wide">
                      {item.type}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{item.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
                    </div>
                  </div>
                  <div className="shrink-0 ml-2">
                    {item.status && <StatusBadge status={item.status} />}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* IA Tools */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
            <Brain className="size-3.5 text-violet-400" />
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">IA — Herramientas</span>
          </div>
          <div className="p-4 space-y-4">
            {/* P&L */}
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground">Análisis financiero P&L con IA.</p>
              <Button size="sm" onClick={runPLAnalysis} disabled={aiLoading}
                className="h-7 text-xs bg-violet-600 hover:bg-violet-500 text-white gap-1.5 glow-sm">
                {aiLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Brain className="size-3.5" />}
                {aiLoading ? "Analizando..." : "Análisis P&L"}
              </Button>
              {aiAnalysis && (
                <div className="p-3 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                  <pre className="text-[11px] text-foreground whitespace-pre-wrap leading-relaxed font-sans">{aiAnalysis}</pre>
                </div>
              )}
            </div>

            <div className="h-px bg-white/[0.06]" />

            {/* Proposal */}
            <div className="space-y-2">
              <p className="text-[11px] text-muted-foreground">Borrador de propuesta para cliente.</p>
              <select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full h-7 rounded-lg border border-white/[0.1] bg-white/[0.04] px-2 text-xs text-foreground">
                <option value="">Seleccionar cliente...</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <textarea value={proposalScope} onChange={(e) => setProposalScope(e.target.value)}
                placeholder="Alcance del proyecto (opcional)..."
                rows={2}
                className="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-2 py-1.5 text-xs text-foreground resize-none" />
              <Button size="sm" onClick={runProposal} disabled={proposalLoading || !selectedClientId}
                className="h-7 text-xs bg-violet-600 hover:bg-violet-500 text-white gap-1.5 glow-sm">
                {proposalLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Brain className="size-3.5" />}
                {proposalLoading ? "Redactando..." : "Redactar Propuesta"}
              </Button>
              {proposal && (
                <div className="p-3 bg-white/[0.03] rounded-lg border border-white/[0.06]">
                  <button onClick={() => { navigator.clipboard.writeText(proposal); toast.success("Copiado"); }}
                    className="text-[10px] text-muted-foreground hover:text-foreground float-right mb-1">Copiar</button>
                  <pre className="text-[11px] text-foreground whitespace-pre-wrap leading-relaxed font-sans clear-both">{proposal}</pre>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

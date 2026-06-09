"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, Wallet, Clock, ExternalLink, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils-format";

// ─── Types ────────────────────────────────────────────────────────────────────

type Project = { id: string; name: string; client: { id: string; name: string } };
type Client  = { id: string; name: string };

type Invoice = {
  id: string; invoiceNumber: string; status: string;
  amount: number; currency: string; createdAt: string; dueDate: string | null;
  source: string | null;
  client: { id: string; name: string } | null;
  project: { id: string; name: string } | null;
};

type Expense = {
  id: string; description: string; amount: number;
  date: string; category: string | null;
  project: { id: string; name: string } | null;
};

type Subscription = {
  id: string; name: string; amount: number;
  billingCycle: string; status: string;
};

type Transaction = {
  id: string; date: string;
  kind: "income" | "expense" | "pending";
  label: string; sublabel: string;
  amount: number; currency: string;
  project?: string;
  href: string;
  rawId: string;
  rawKind: "invoice" | "expense";
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function monthKey(d: string) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleString("es-AR", { month: "long", year: "numeric" });
}
function last12Months(): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}
function todayStr() {
  if (typeof window === "undefined") return "";
  return new Date().toISOString().slice(0, 10);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FinancesPage() {
  const [invoices,      setInvoices]      = useState<Invoice[]>([]);
  const [expenses,      setExpenses]      = useState<Expense[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [projects,      setProjects]      = useState<Project[]>([]);
  const [clients,       setClients]       = useState<Client[]>([]);
  const [loading,       setLoading]       = useState(true);

  const [period, setPeriod] = useState<string>("all");
  const [tab,    setTab]    = useState<"all" | "income" | "expense">("all");

  // Dialogs
  const [incomeOpen,  setIncomeOpen]  = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);

  const [incomeMode, setIncomeMode] = useState<"client" | "platform">("client");
  const [incomeForm, setIncomeForm] = useState({
    clientId: "", projectId: "", source: "", amount: "", currency: "USD", dueDate: todayStr(), notes: "",
  });
  const [expenseForm, setExpenseForm] = useState({
    description: "", amount: "", category: "", projectId: "", date: todayStr(), notes: "",
  });

  const load = useCallback(async () => {
    try {
      const [invRes, expRes, subRes, projRes, clientRes] = await Promise.all([
        fetch("/api/invoices"), fetch("/api/expenses"), fetch("/api/subscriptions"),
        fetch("/api/projects"), fetch("/api/clients"),
      ]);
      const [invData, expData, subData, projData, clientData] = await Promise.all([
        invRes.json(), expRes.json(), subRes.json(), projRes.json(), clientRes.json(),
      ]);
      if (Array.isArray(invData))    setInvoices(invData);
      if (Array.isArray(expData))    setExpenses(expData);
      if (Array.isArray(subData))    setSubscriptions(subData);
      if (Array.isArray(projData))   setProjects(projData);
      if (Array.isArray(clientData)) setClients(clientData);
    } catch {
      // session missing or API error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Create Income (PAID invoice) ─────────────────────────────────────────

  async function handleCreateIncome(e: React.FormEvent) {
    e.preventDefault();
    if (incomeMode === "platform" && !incomeForm.source) return toast.error("Ingresá el nombre de la plataforma");
    if (!incomeForm.amount) return toast.error("Ingresá el monto");
    const res = await fetch("/api/invoices", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId:  incomeMode === "client" ? (incomeForm.clientId || null) : null,
        projectId: incomeMode === "client" ? (incomeForm.projectId || null) : null,
        source:    incomeMode === "platform" ? incomeForm.source : null,
        amount:    Number(incomeForm.amount),
        currency:  incomeForm.currency,
        status:    "PAID",
        dueDate:   incomeForm.dueDate || null,
        notes:     incomeForm.notes || null,
      }),
    });
    if (res.ok) {
      toast.success("Ingreso registrado");
      setIncomeOpen(false);
      setIncomeForm({ clientId: "", projectId: "", source: "", amount: "", currency: "USD", dueDate: todayStr(), notes: "" });
      load();
    } else toast.error("Error al guardar");
  }

  // ── Create Expense ────────────────────────────────────────────────────────

  async function handleCreateExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!expenseForm.description || !expenseForm.amount) return toast.error("Completá descripción y monto");
    const res = await fetch("/api/expenses", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: expenseForm.description,
        amount:      Number(expenseForm.amount),
        date:        expenseForm.date,
        category:    expenseForm.category || null,
        projectId:   expenseForm.projectId || null,
        notes:       expenseForm.notes || null,
      }),
    });
    if (res.ok) {
      toast.success("Egreso registrado");
      setExpenseOpen(false);
      setExpenseForm({ description: "", amount: "", category: "", projectId: "", date: todayStr(), notes: "" });
      load();
    } else toast.error("Error al guardar");
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete(tx: Transaction) {
    const url = tx.rawKind === "invoice"
      ? `/api/invoices/${tx.rawId}`
      : `/api/expenses/${tx.rawId}`;
    const res = await fetch(url, { method: "DELETE" });
    if (res.ok) { toast.success("Eliminado"); load(); }
    else toast.error("Error al eliminar");
  }

  // ── Build transactions ────────────────────────────────────────────────────

  const months = useMemo(() => last12Months(), []);

  const allTransactions = useMemo<Transaction[]>(() => {
    const txs: Transaction[] = [];

    for (const inv of invoices) {
      if (inv.status === "PAID") {
        txs.push({
          id: inv.id, date: inv.dueDate ?? inv.createdAt, kind: "income", rawId: inv.id, rawKind: "invoice",
          label: inv.source ?? inv.invoiceNumber,
          sublabel: inv.client?.name ?? inv.source ?? "Ingreso",
          project: inv.project?.name,
          amount: inv.amount, currency: inv.currency,
          href: "/invoices",
        });
      } else if (inv.status === "PENDING") {
        txs.push({
          id: `pend-${inv.id}`, date: inv.dueDate ?? inv.createdAt, kind: "pending",
          rawId: inv.id, rawKind: "invoice",
          label: inv.invoiceNumber,
          sublabel: `${inv.client?.name ?? inv.source ?? "Ingreso"} — pendiente`,
          project: inv.project?.name,
          amount: inv.amount, currency: inv.currency,
          href: "/invoices",
        });
      }
    }

    for (const exp of expenses) {
      txs.push({
        id: exp.id, date: exp.date, kind: "expense", rawId: exp.id, rawKind: "expense",
        label: exp.description,
        sublabel: exp.category ?? "Gasto",
        project: exp.project?.name,
        amount: exp.amount, currency: "USD",
        href: "/expenses",
      });
    }

    return txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, expenses]);

  const filtered = useMemo(() =>
    period === "all" ? allTransactions : allTransactions.filter((t) => monthKey(t.date) === period),
  [allTransactions, period]);

  const tabFiltered = useMemo(() => {
    if (tab === "income")  return filtered.filter((t) => t.kind === "income" || t.kind === "pending");
    if (tab === "expense") return filtered.filter((t) => t.kind === "expense");
    return filtered;
  }, [filtered, tab]);

  const stats = useMemo(() => {
    const income  = filtered.filter((t) => t.kind === "income").reduce((s, t) => s + t.amount, 0);
    const expense = filtered.filter((t) => t.kind === "expense").reduce((s, t) => s + t.amount, 0);
    const pending = filtered.filter((t) => t.kind === "pending").reduce((s, t) => s + t.amount, 0);
    const activeSubs = subscriptions.filter((s) => s.status === "ACTIVE");
    const monthlyBurn = activeSubs.reduce(
      (s, sub) => s + (sub.billingCycle === "MONTHLY" ? sub.amount : sub.amount / 12), 0
    );
    return { income, expense, balance: income - expense, pending, monthlyBurn, activeSubs: activeSubs.length };
  }, [filtered, subscriptions]);

  // ── Filtered projects for income form (by selected client) ───────────────
  const clientProjects = useMemo(
    () => projects.filter((p) => !incomeForm.clientId || p.client.id === incomeForm.clientId),
    [projects, incomeForm.clientId]
  );

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) return <div className="p-6 text-xs text-muted-foreground">Cargando...</div>;

  return (
    <div className="p-6 space-y-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold">Finanzas</h1>
          <p className="text-xs text-muted-foreground">Ingresos y egresos</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period} onChange={(e) => setPeriod(e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
          >
            <option value="all">Todo el tiempo</option>
            {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
          </select>
          <Button onClick={() => setExpenseOpen(true)} size="sm"
            className="h-8 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20">
            <Plus className="size-3.5 mr-1" /> Egreso
          </Button>
          <Button onClick={() => setIncomeOpen(true)} size="sm"
            className="h-8 text-xs bg-[#0070F3] hover:bg-[#3385F5] text-white">
            <Plus className="size-3.5 mr-1" /> Ingreso
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard icon={<TrendingUp className="size-4 text-emerald-400" />} label="Ingresos"
          value={formatCurrency(stats.income)} color="emerald"
          sub={`${filtered.filter((t) => t.kind === "income").length} cobradas`} />
        <SummaryCard icon={<TrendingDown className="size-4 text-red-400" />} label="Egresos"
          value={formatCurrency(stats.expense)} color="red"
          sub={`${filtered.filter((t) => t.kind === "expense").length} gastos`} />
        <SummaryCard icon={<Wallet className="size-4 text-[#0070F3]" />} label="Balance"
          value={formatCurrency(stats.balance)} color={stats.balance >= 0 ? "blue" : "red"}
          sub={stats.balance >= 0 ? "Positivo" : "Negativo"} />
        <SummaryCard icon={<Clock className="size-4 text-amber-400" />} label="Por Cobrar"
          value={formatCurrency(stats.pending)} color="amber"
          sub={`${filtered.filter((t) => t.kind === "pending").length} pendientes`} />
      </div>

      {/* Burn subs */}
      <div className="rounded-md border border-border bg-card px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium">Burn mensual — Suscripciones</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{stats.activeSubs} activas</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-red-400">{formatCurrency(stats.monthlyBurn)}/mes</span>
          <Link href="/subscriptions" className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1">
            Ver <ExternalLink className="size-3" />
          </Link>
        </div>
      </div>

      {/* Tabs + List */}
      <div className="space-y-3">
        <div className="flex items-center gap-1 border-b border-border pb-2">
          {(["all", "income", "expense"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${tab === t ? "bg-[#0070F3]/10 text-[#0070F3] font-medium" : "text-muted-foreground hover:text-foreground"}`}>
              {t === "all" ? "Todo" : t === "income" ? "Ingresos" : "Egresos"}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-muted-foreground">{tabFiltered.length} movimientos</span>
        </div>

        {tabFiltered.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">Sin movimientos en este período.</p>
        ) : (
          <div className="rounded-md border border-border overflow-hidden">
            {tabFiltered.map((tx) => (
              <div key={tx.id}
                className="flex items-center justify-between px-4 py-3 border-b border-border last:border-0 hover:bg-card-elevated transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`size-2 rounded-full shrink-0 ${
                    tx.kind === "income" ? "bg-emerald-400" : tx.kind === "pending" ? "bg-amber-400" : "bg-red-400"
                  }`} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{tx.label}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {tx.sublabel}
                      {tx.project && <span className="ml-1.5 text-[#0070F3]/70">· {tx.project}</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(tx.date).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <span className={`text-xs font-medium tabular-nums w-24 text-right ${
                    tx.kind === "income" ? "text-emerald-400" : tx.kind === "pending" ? "text-amber-400" : "text-red-400"
                  }`}>
                    {tx.kind === "expense" ? "−" : "+"}{formatCurrency(tx.amount, tx.currency)}
                  </span>
                  <button onClick={() => handleDelete(tx)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Nuevo Ingreso Dialog ───────────────────────────────────────────── */}
      <Dialog open={incomeOpen} onOpenChange={setIncomeOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader><DialogTitle className="text-sm">Nuevo Ingreso</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateIncome} className="space-y-3 mt-2">
            {/* Mode toggle */}
            <div className="flex rounded-md border border-border overflow-hidden">
              {(["client", "platform"] as const).map((m) => (
                <button key={m} type="button" onClick={() => setIncomeMode(m)}
                  className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                    incomeMode === m ? "bg-[#0070F3] text-white" : "text-muted-foreground hover:text-foreground"
                  }`}>
                  {m === "client" ? "Cliente / Proyecto" : "Plataforma / Comisión"}
                </button>
              ))}
            </div>

            {incomeMode === "client" ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Cliente</label>
                  <select value={incomeForm.clientId}
                    onChange={(e) => setIncomeForm({ ...incomeForm, clientId: e.target.value, projectId: "" })}
                    className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground">
                    <option value="">Sin cliente</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Proyecto</label>
                  <select value={incomeForm.projectId} onChange={(e) => setIncomeForm({ ...incomeForm, projectId: e.target.value })}
                    className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground">
                    <option value="">Sin proyecto</option>
                    {clientProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Plataforma / Fuente *</label>
                <Input required={incomeMode === "platform"} placeholder="Ej: Framer referidos, YouTube, etc."
                  value={incomeForm.source} onChange={(e) => setIncomeForm({ ...incomeForm, source: e.target.value })}
                  className="h-8 text-xs bg-background" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Monto *</label>
                <Input required type="number" step="0.01" placeholder="0.00"
                  value={incomeForm.amount} onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                  className="h-8 text-xs bg-background" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Moneda</label>
                <select value={incomeForm.currency} onChange={(e) => setIncomeForm({ ...incomeForm, currency: e.target.value })}
                  className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground">
                  {["USD", "ARS", "EUR", "BTC"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Fecha</label>
              <Input type="date" value={incomeForm.dueDate} onChange={(e) => setIncomeForm({ ...incomeForm, dueDate: e.target.value })}
                className="h-8 text-xs bg-background" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Notas</label>
              <Input placeholder="Opcional..." value={incomeForm.notes} onChange={(e) => setIncomeForm({ ...incomeForm, notes: e.target.value })}
                className="h-8 text-xs bg-background" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={() => setIncomeOpen(false)}>Cancelar</Button>
              <Button type="submit" size="sm" className="bg-[#0070F3] hover:bg-[#3385F5] text-white">Guardar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Nuevo Egreso Dialog ────────────────────────────────────────────── */}
      <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader><DialogTitle className="text-sm">Nuevo Egreso</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateExpense} className="space-y-3 mt-2">
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Descripción *</label>
              <Input required placeholder="Ej: Hosting, herramienta, etc."
                value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                className="h-8 text-xs bg-background" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Monto *</label>
                <Input required type="number" step="0.01" placeholder="0.00"
                  value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  className="h-8 text-xs bg-background" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Fecha</label>
                <Input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  className="h-8 text-xs bg-background" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Categoría</label>
                <Input placeholder="Ej: herramientas, ads..."
                  value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="h-8 text-xs bg-background" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Proyecto</label>
                <select value={expenseForm.projectId} onChange={(e) => setExpenseForm({ ...expenseForm, projectId: e.target.value })}
                  className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground">
                  <option value="">Sin proyecto</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.client.name}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Notas</label>
              <Input placeholder="Opcional..." value={expenseForm.notes} onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                className="h-8 text-xs bg-background" />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={() => setExpenseOpen(false)}>Cancelar</Button>
              <Button type="submit" size="sm" className="bg-red-500 hover:bg-red-600 text-white">Guardar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string; sub: string;
  color: "emerald" | "red" | "blue" | "amber";
}) {
  const border = { emerald: "border-emerald-500/20", red: "border-red-500/20", blue: "border-[#0070F3]/20", amber: "border-amber-500/20" }[color];
  return (
    <div className={`rounded-md border bg-card p-4 ${border}`}>
      <div className="flex items-center justify-between mb-2">{icon}</div>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
      <p className="text-[10px] text-zinc-600 mt-0.5">{sub}</p>
    </div>
  );
}

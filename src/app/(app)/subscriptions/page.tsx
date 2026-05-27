"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DataView, Column,
  RecordSlideOver, FieldRow, FieldGrid,
  StatusBadge,
  FilterBar, useFilterState, applyFilter,
  BatchActionBar,
} from "@/components/shared";
import { formatCurrency, formatDate, toInputDate } from "@/lib/utils-format";

type Subscription = {
  id: string; name: string; amount: number; billingCycle: string; status: string;
  url: string | null; notes: string | null; renewsAt: string | null; createdAt: string;
};

const STATUS_OPTIONS = ["ACTIVE", "PAUSED", "CANCELLED"];
const CYCLE_OPTIONS = ["MONTHLY", "ANNUAL"];

export default function SubscriptionsPage() {
  const [data, setData] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Subscription | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterState, setFilterState] = useFilterState();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", amount: "", billingCycle: "MONTHLY", status: "ACTIVE", url: "", renewsAt: "" });

  const load = useCallback(async () => {
    const res = await fetch("/api/subscriptions");
    setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/subscriptions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { toast.success("Suscripción creada"); setCreateOpen(false); setForm({ name: "", amount: "", billingCycle: "MONTHLY", status: "ACTIVE", url: "", renewsAt: "" }); load(); }
    else toast.error("Error al crear suscripción");
  }

  async function handleUpdate(id: string, patch: Partial<Subscription>) {
    const res = await fetch(`/api/subscriptions/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) { load(); if (selected?.id === id) setSelected((p) => p ? { ...p, ...patch } : null); }
    else toast.error("Error al actualizar");
  }

  async function handleDelete(ids: string[]) {
    await Promise.all(ids.map((id) => fetch(`/api/subscriptions/${id}`, { method: "DELETE" })));
    toast.success(`${ids.length} eliminados`);
    setSelectedIds([]);
    if (selected && ids.includes(selected.id)) setSelected(null);
    load();
  }

  const active = data.filter((s) => s.status === "ACTIVE");
  const monthlyTotal = active.reduce((sum, s) => sum + (s.billingCycle === "MONTHLY" ? s.amount : s.amount / 12), 0);
  const filtered = applyFilter(data, filterState, ["name"], { status: "status", billingCycle: "billingCycle" });

  const columns: Column<Subscription>[] = [
    { key: "name", label: "Nombre", sortable: true, render: (r) => <span className="font-medium">{r.name}</span> },
    {
      key: "amount", label: "Monto", sortable: true,
      render: (r) => (
        <span className="tabular-nums font-medium">
          {formatCurrency(r.amount)}
          <span className="text-muted-foreground text-[10px] ml-1">/{r.billingCycle === "MONTHLY" ? "mes" : "año"}</span>
        </span>
      ),
    },
    {
      key: "monthly", label: "Costo Mensual",
      render: (r) => <span className="tabular-nums text-muted-foreground">{formatCurrency(r.billingCycle === "MONTHLY" ? r.amount : r.amount / 12)}</span>,
    },
    { key: "billingCycle", label: "Ciclo", render: (r) => <StatusBadge status={r.billingCycle} /> },
    { key: "status", label: "Estado", sortable: true, render: (r) => <StatusBadge status={r.status} /> },
    { key: "renewsAt", label: "Renueva", render: (r) => <span className="text-muted-foreground">{formatDate(r.renewsAt)}</span> },
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold">Suscripciones</h1>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-muted-foreground">{data.length} total · {active.length} activas</span>
            <span className="text-xs text-[#0070F3]">Gasto mensual: {formatCurrency(monthlyTotal)}</span>
          </div>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-[#0070F3] hover:bg-[#3385F5] text-white text-xs font-medium transition-colors">
            <Plus className="size-3.5" /> Nueva Suscripción
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-card border-border">
            <DialogHeader><DialogTitle className="text-sm">Nueva Suscripción</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3 mt-2">
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Nombre *</label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-8 text-xs bg-background" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1 space-y-1">
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Monto *</label>
                  <Input required type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="h-8 text-xs bg-background" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Ciclo</label>
                  <select value={form.billingCycle} onChange={(e) => setForm({ ...form, billingCycle: e.target.value })} className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground">
                    {CYCLE_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Estado</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground">
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wide">URL</label>
                  <Input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="h-8 text-xs bg-background" placeholder="https://..." />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Renueva El</label>
                  <Input type="date" value={form.renewsAt} onChange={(e) => setForm({ ...form, renewsAt: e.target.value })} className="h-8 text-xs bg-background" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" size="sm" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                <Button type="submit" size="sm" className="bg-[#0070F3] hover:bg-[#3385F5] text-white">Crear</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <FilterBar
        state={filterState} onChange={setFilterState} placeholder="Buscar suscripciones..."
        filterGroups={[
          { key: "status", label: "Estado", options: STATUS_OPTIONS.map((s) => ({ key: s, label: s })) },
          { key: "billingCycle", label: "Ciclo", options: CYCLE_OPTIONS.map((c) => ({ key: c, label: c })) },
        ]}
        sortOptions={[{ key: "name", label: "Nombre" }, { key: "amount", label: "Monto" }]}
      />

      <DataView
        data={filtered} columns={columns}
        onRowClick={setSelected} onUpdate={handleUpdate}
        selectedIds={selectedIds} onSelectIds={setSelectedIds}
        isLoading={loading} emptyMessage="Sin suscripciones aún."
      />

      {selected && (
        <RecordSlideOver
          open={!!selected} onClose={() => setSelected(null)}
          title={selected.name}
          badge={<StatusBadge status={selected.status} />}
          actions={
            <div className="flex gap-2">
              {selected.url && (
                <a
                  href={selected.url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 h-7 px-2.5 rounded border border-border text-xs text-foreground hover:bg-card-elevated transition-colors"
                >
                  <ExternalLink className="size-3.5" /> Abrir
                </a>
              )}
              <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => handleDelete([selected.id])}>
                <Trash2 className="size-3.5 mr-1" /> Eliminar
              </Button>
            </div>
          }
        >
          <FieldGrid>
            <FieldRow label="Estado">
              <select value={selected.status} onChange={(e) => handleUpdate(selected.id, { status: e.target.value })}
                className="w-full h-7 rounded border border-border bg-card-elevated px-2 text-xs text-foreground">
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </FieldRow>
            <FieldRow label="Ciclo de Facturación">
              <select value={selected.billingCycle} onChange={(e) => handleUpdate(selected.id, { billingCycle: e.target.value })}
                className="w-full h-7 rounded border border-border bg-card-elevated px-2 text-xs text-foreground">
                {CYCLE_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </FieldRow>
          </FieldGrid>
          <FieldRow label="Monto">
            <input type="number" step="0.01" defaultValue={selected.amount}
              onBlur={(e) => handleUpdate(selected.id, { amount: Number(e.target.value) })}
              className="w-full h-7 rounded border border-border bg-card-elevated px-2 text-xs text-foreground" />
          </FieldRow>
          <FieldRow label="Renueva El">
            <input type="date" defaultValue={toInputDate(selected.renewsAt)}
              onBlur={(e) => handleUpdate(selected.id, { renewsAt: e.target.value })}
              className="w-full h-7 rounded border border-border bg-card-elevated px-2 text-xs text-foreground" />
          </FieldRow>
          <FieldRow label="URL">
            <input defaultValue={selected.url ?? ""}
              onBlur={(e) => handleUpdate(selected.id, { url: e.target.value })}
              placeholder="https://..."
              className="w-full h-7 rounded border border-border bg-card-elevated px-2 text-xs text-foreground" />
          </FieldRow>
          <FieldRow label="Notas">
            <textarea defaultValue={selected.notes ?? ""} onBlur={(e) => handleUpdate(selected.id, { notes: e.target.value })}
              rows={3} className="w-full rounded border border-border bg-card-elevated px-2 py-1.5 text-xs text-foreground resize-none" />
          </FieldRow>
          <FieldRow label="Costo Mensual">
            <span className="text-sm font-medium">{formatCurrency(selected.billingCycle === "MONTHLY" ? selected.amount : selected.amount / 12)}/mes</span>
          </FieldRow>
        </RecordSlideOver>
      )}

      <BatchActionBar
        selectedIds={selectedIds} onClearSelection={() => setSelectedIds([])}
        actions={[{ label: "Eliminar", variant: "destructive", icon: <Trash2 className="size-3.5" />, onClick: handleDelete }]}
      />
    </div>
  );
}

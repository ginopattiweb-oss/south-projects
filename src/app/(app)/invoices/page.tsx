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
  StatusBadge, RelationBadge,
  FilterBar, useFilterState, applyFilter,
  BatchActionBar, CreatableSelect,
} from "@/components/shared";
import { formatCurrency, formatDate, toInputDate } from "@/lib/utils-format";

type Invoice = {
  id: string; invoiceNumber: string; status: string; clientId: string; projectId: string | null;
  amount: number; currency: string; invoiceUrl: string | null; notes: string | null; dueDate: string | null;
  client: { id: string; name: string }; project: { id: string; name: string } | null; createdAt: string;
};

type Client = { id: string; name: string };
type Project = { id: string; name: string; clientId: string };

const STATUS_OPTIONS = ["DRAFT", "PENDING", "PAID", "CANCELED"];
const CURRENCY_OPTIONS = ["USD", "ARS", "EUR", "BTC"];

export default function InvoicesPage() {
  const [data, setData] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterState, setFilterState] = useFilterState();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ clientId: "", projectId: "", amount: "", currency: "USD", status: "DRAFT", notes: "", dueDate: "" });

  const load = useCallback(async () => {
    const [invRes, clientRes, projRes] = await Promise.all([
      fetch("/api/invoices"), fetch("/api/clients"), fetch("/api/projects"),
    ]);
    setData(await invRes.json());
    setClients(await clientRes.json());
    setProjects(await projRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clientId) return toast.error("Seleccioná un cliente");
    const res = await fetch("/api/invoices", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { toast.success("Factura creada"); setCreateOpen(false); setForm({ clientId: "", projectId: "", amount: "", currency: "USD", status: "DRAFT", notes: "", dueDate: "" }); load(); }
    else toast.error("Error al crear factura");
  }

  async function handleUpdate(id: string, patch: Partial<Invoice>) {
    const res = await fetch(`/api/invoices/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) { load(); if (selected?.id === id) setSelected((p) => p ? { ...p, ...patch } : null); }
    else toast.error("Error al actualizar");
  }

  async function handleDelete(ids: string[]) {
    await Promise.all(ids.map((id) => fetch(`/api/invoices/${id}`, { method: "DELETE" })));
    toast.success(`${ids.length} deleted`);
    setSelectedIds([]);
    if (selected && ids.includes(selected.id)) setSelected(null);
    load();
  }

  const clientProjects = projects.filter((p) => p.clientId === form.clientId);
  const filtered = applyFilter(data, filterState, ["invoiceNumber"], { status: "status", clientId: "clientId", currency: "currency" });

  // Stats
  const totalPaid = data.filter((i) => i.status === "PAID").reduce((sum, i) => sum + i.amount, 0);
  const totalPending = data.filter((i) => i.status === "PENDING").reduce((sum, i) => sum + i.amount, 0);

  const columns: Column<Invoice>[] = [
    { key: "invoiceNumber", label: "Factura #", sortable: true, render: (r) => <span className="font-mono text-xs font-medium">{r.invoiceNumber}</span> },
    { key: "status", label: "Estado", sortable: true, render: (r) => <StatusBadge status={r.status} /> },
    { key: "client", label: "Cliente", render: (r) => <RelationBadge label={r.client?.name ?? "—"} /> },
    { key: "project", label: "Proyecto", render: (r) => r.project ? <span className="text-xs text-muted-foreground">{r.project.name}</span> : <span className="text-xs text-muted-foreground">—</span> },
    { key: "amount", label: "Monto", sortable: true, render: (r) => <span className="tabular-nums font-medium">{formatCurrency(r.amount, r.currency)}</span> },
    { key: "currency", label: "Moneda", render: (r) => <StatusBadge status={r.currency} /> },
    { key: "dueDate", label: "Vence", render: (r) => <span className="text-muted-foreground">{formatDate(r.dueDate)}</span> },
    { key: "createdAt", label: "Creado", sortable: true, render: (r) => <span className="text-muted-foreground">{formatDate(r.createdAt)}</span> },
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold">Facturas</h1>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-muted-foreground">{data.length} total</span>
            <span className="text-xs text-emerald-400">Cobrado: {formatCurrency(totalPaid)}</span>
            <span className="text-xs text-amber-400">Pendiente: {formatCurrency(totalPending)}</span>
          </div>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-[#0070F3] hover:bg-[#3385F5] text-white text-xs font-medium transition-colors">
            <Plus className="size-3.5" /> Nueva Factura
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-card border-border">
            <DialogHeader><DialogTitle className="text-sm">Nueva Factura</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Cliente *</label>
                  <CreatableSelect
                    required
                    options={clients.map((c) => ({ id: c.id, label: c.name }))}
                    value={form.clientId}
                    onChange={(id) => setForm({ ...form, clientId: id, projectId: "" })}
                    createLabel="Crear cliente"
                    onCreate={async (name) => {
                      const res = await fetch("/api/clients", {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name, status: "ACTIVE", currency: "USD" }),
                      });
                      const c = await res.json();
                      return { id: c.id, label: c.name };
                    }}
                    onCreated={(o) => setClients((prev) => [...prev, { id: o.id, name: o.label }])}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Proyecto</label>
                  <CreatableSelect
                    options={clientProjects.map((p) => ({ id: p.id, label: p.name }))}
                    value={form.projectId}
                    onChange={(id) => setForm({ ...form, projectId: id })}
                    placeholder="Ninguno"
                    createLabel="Crear proyecto"
                    onCreate={async (name) => {
                      const res = await fetch("/api/projects", {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name, clientId: form.clientId, status: "NOT_STARTED" }),
                      });
                      const p = await res.json();
                      return { id: p.id, label: p.name };
                    }}
                    onCreated={(o) => setProjects((prev) => [...prev, { id: o.id, name: o.label, clientId: form.clientId }])}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Monto *</label>
                  <Input required type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="h-8 text-xs bg-background" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Moneda</label>
                  <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground">
                    {CURRENCY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Estado</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground">
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Fecha de Vencimiento</label>
                  <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="h-8 text-xs bg-background" />
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
        state={filterState} onChange={setFilterState} placeholder="Buscar facturas..."
        filterGroups={[
          { key: "status", label: "Estado", options: STATUS_OPTIONS.map((s) => ({ key: s, label: s })) },
          { key: "currency", label: "Moneda", options: CURRENCY_OPTIONS.map((c) => ({ key: c, label: c })) },
        ]}
        sortOptions={[{ key: "invoiceNumber", label: "Factura #" }, { key: "amount", label: "Monto" }, { key: "createdAt", label: "Creado" }]}
      />

      <DataView
        data={filtered} columns={columns}
        onRowClick={setSelected} onUpdate={handleUpdate}
        selectedIds={selectedIds} onSelectIds={setSelectedIds}
        isLoading={loading} emptyMessage="Sin facturas aún."
      />

      {selected && (
        <RecordSlideOver
          open={!!selected} onClose={() => setSelected(null)}
          title={selected.invoiceNumber}
          subtitle={selected.client?.name}
          badge={<StatusBadge status={selected.status} />}
          actions={
            <div className="flex gap-2">
              {selected.invoiceUrl && (
                <a
                  href={selected.invoiceUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 h-7 px-2.5 rounded border border-border text-xs text-foreground hover:bg-card-elevated transition-colors"
                >
                  <ExternalLink className="size-3.5" /> Ver PDF
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
            <FieldRow label="Moneda">
              <select value={selected.currency} onChange={(e) => handleUpdate(selected.id, { currency: e.target.value })}
                className="w-full h-7 rounded border border-border bg-card-elevated px-2 text-xs text-foreground">
                {CURRENCY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </FieldRow>
          </FieldGrid>
          <FieldRow label="Monto">
            <input type="number" step="0.01" defaultValue={selected.amount}
              onBlur={(e) => handleUpdate(selected.id, { amount: Number(e.target.value) })}
              className="w-full h-7 rounded border border-border bg-card-elevated px-2 text-xs text-foreground" />
          </FieldRow>
          <FieldRow label="Fecha de Vencimiento">
            <input type="date" defaultValue={toInputDate(selected.dueDate)}
              onBlur={(e) => handleUpdate(selected.id, { dueDate: e.target.value })}
              className="w-full h-7 rounded border border-border bg-card-elevated px-2 text-xs text-foreground" />
          </FieldRow>
          <FieldRow label="URL de Factura">
            <input defaultValue={selected.invoiceUrl ?? ""}
              onBlur={(e) => handleUpdate(selected.id, { invoiceUrl: e.target.value })}
              placeholder="https://..."
              className="w-full h-7 rounded border border-border bg-card-elevated px-2 text-xs text-foreground" />
          </FieldRow>
          <FieldRow label="Notas">
            <textarea defaultValue={selected.notes ?? ""} onBlur={(e) => handleUpdate(selected.id, { notes: e.target.value })}
              rows={3} className="w-full rounded border border-border bg-card-elevated px-2 py-1.5 text-xs text-foreground resize-none" />
          </FieldRow>
          <FieldRow label="Creado">
            <span className="text-sm text-muted-foreground">{formatDate(selected.createdAt)}</span>
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

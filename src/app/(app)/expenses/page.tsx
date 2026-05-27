"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DataView, Column,
  RecordSlideOver, FieldRow, FieldGrid,
  FilterBar, useFilterState, applyFilter,
  BatchActionBar,
} from "@/components/shared";
import { formatCurrency, formatDate, toInputDate } from "@/lib/utils-format";

type Expense = {
  id: string; description: string; amount: number; date: string;
  category: string | null; receiptUrl: string | null; notes: string | null; createdAt: string;
};

const CATEGORIES = ["Software", "Hardware", "Oficina", "Marketing", "Viajes", "Contratista", "Otro"];

export default function ExpensesPage() {
  const [data, setData] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Expense | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterState, setFilterState] = useFilterState();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ description: "", amount: "", date: new Date().toISOString().split("T")[0], category: "", notes: "" });

  const load = useCallback(async () => {
    const res = await fetch("/api/expenses");
    setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/expenses", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { toast.success("Gasto registrado"); setCreateOpen(false); setForm({ description: "", amount: "", date: new Date().toISOString().split("T")[0], category: "", notes: "" }); load(); }
    else toast.error("Error al registrar gasto");
  }

  async function handleUpdate(id: string, patch: Partial<Expense>) {
    const res = await fetch(`/api/expenses/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) { load(); if (selected?.id === id) setSelected((p) => p ? { ...p, ...patch } : null); }
    else toast.error("Error al actualizar");
  }

  async function handleDelete(ids: string[]) {
    await Promise.all(ids.map((id) => fetch(`/api/expenses/${id}`, { method: "DELETE" })));
    toast.success(`${ids.length} deleted`);
    setSelectedIds([]);
    if (selected && ids.includes(selected.id)) setSelected(null);
    load();
  }

  const filtered = applyFilter(data, filterState, ["description", "category"], { category: "category" });
  const totalThisMonth = data.filter((e) => {
    const d = new Date(e.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, e) => sum + e.amount, 0);
  const totalAll = data.reduce((sum, e) => sum + e.amount, 0);

  const columns: Column<Expense>[] = [
    { key: "description", label: "Descripción", sortable: true, render: (r) => <span className="font-medium">{r.description}</span> },
    { key: "amount", label: "Monto", sortable: true, render: (r) => <span className="tabular-nums font-medium">{formatCurrency(r.amount)}</span> },
    { key: "date", label: "Fecha", sortable: true, render: (r) => <span className="text-muted-foreground">{formatDate(r.date)}</span> },
    { key: "category", label: "Categoría", render: (r) => <span className="text-xs text-muted-foreground">{r.category ?? "—"}</span> },
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold">Gastos</h1>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-muted-foreground">{data.length} total</span>
            <span className="text-xs text-red-400">Este mes: {formatCurrency(totalThisMonth)}</span>
            <span className="text-xs text-muted-foreground">Total: {formatCurrency(totalAll)}</span>
          </div>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-[#0070F3] hover:bg-[#3385F5] text-white text-xs font-medium transition-colors">
            <Plus className="size-3.5" /> Registrar Gasto
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-card border-border">
            <DialogHeader><DialogTitle className="text-sm">Registrar Gasto</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3 mt-2">
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Descripción *</label>
                <Input required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="h-8 text-xs bg-background" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Monto *</label>
                  <Input required type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="h-8 text-xs bg-background" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Fecha</label>
                  <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="h-8 text-xs bg-background" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Categoría</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground">
                  <option value="">Ninguna</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" size="sm" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                <Button type="submit" size="sm" className="bg-[#0070F3] hover:bg-[#3385F5] text-white">Registrar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <FilterBar
        state={filterState} onChange={setFilterState} placeholder="Buscar gastos..."
        filterGroups={[{ key: "category", label: "Categoría", options: CATEGORIES.map((c) => ({ key: c, label: c })) }]}
        sortOptions={[{ key: "date", label: "Fecha" }, { key: "amount", label: "Monto" }, { key: "description", label: "Descripción" }]}
      />

      <DataView
        data={filtered} columns={columns}
        onRowClick={setSelected} onUpdate={handleUpdate}
        selectedIds={selectedIds} onSelectIds={setSelectedIds}
        isLoading={loading} emptyMessage="Sin gastos registrados aún."
      />

      {selected && (
        <RecordSlideOver
          open={!!selected} onClose={() => setSelected(null)}
          title={selected.description}
          subtitle={selected.category ?? undefined}
          actions={
            <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => handleDelete([selected.id])}>
              <Trash2 className="size-3.5 mr-1" /> Eliminar
            </Button>
          }
        >
          <FieldGrid>
            <FieldRow label="Monto">
              <input type="number" step="0.01" defaultValue={selected.amount}
                onBlur={(e) => handleUpdate(selected.id, { amount: Number(e.target.value) })}
                className="w-full h-7 rounded border border-border bg-card-elevated px-2 text-xs text-foreground" />
            </FieldRow>
            <FieldRow label="Fecha">
              <input type="date" defaultValue={toInputDate(selected.date)}
                onBlur={(e) => handleUpdate(selected.id, { date: e.target.value })}
                className="w-full h-7 rounded border border-border bg-card-elevated px-2 text-xs text-foreground" />
            </FieldRow>
          </FieldGrid>
          <FieldRow label="Categoría">
            <select defaultValue={selected.category ?? ""}
              onBlur={(e) => handleUpdate(selected.id, { category: e.target.value })}
              className="w-full h-7 rounded border border-border bg-card-elevated px-2 text-xs text-foreground">
              <option value="">Ninguna</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </FieldRow>
          <FieldRow label="URL del Comprobante">
            <input defaultValue={selected.receiptUrl ?? ""}
              onBlur={(e) => handleUpdate(selected.id, { receiptUrl: e.target.value })}
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

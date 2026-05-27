"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DataView, Column, KanbanConfig,
  RecordSlideOver, FieldRow, FieldGrid,
  StatusBadge, RelationBadge,
  FilterBar, useFilterState, applyFilter,
  BatchActionBar,
} from "@/components/shared";
import { formatDate } from "@/lib/utils-format";

type Client = {
  id: string; name: string; status: string; contactEmail: string | null;
  currency: string; notes: string | null; logoUrl: string | null;
  projects: { id: string }[]; invoices: { id: string }[]; createdAt: string; updatedAt: string;
};

const STATUS_OPTIONS = ["LEAD", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"];
const CURRENCY_OPTIONS = ["USD", "ARS", "EUR", "BTC"];

const KANBAN_GROUPS = [
  { key: "LEAD",      label: "Prospecto",  color: "#9F9F9F" },
  { key: "ACTIVE",    label: "Activo",     color: "#0070F3" },
  { key: "PAUSED",    label: "Pausado",    color: "#F59E0B" },
  { key: "COMPLETED", label: "Completado", color: "#10B981" },
  { key: "ARCHIVED",  label: "Archivado",  color: "#3D3D3D" },
];

function InlineText({
  value, onSave, onCancel,
}: { value: string; onSave: (v: string) => void; onCancel: () => void }) {
  return (
    <input
      autoFocus defaultValue={value}
      onBlur={(e) => onSave(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter") onSave(e.currentTarget.value); if (e.key === "Escape") onCancel(); }}
      className="w-full h-6 bg-card-elevated border border-[#0070F3] rounded px-1 text-xs outline-none"
    />
  );
}

export default function ClientsPage() {
  const [data, setData] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Client | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterState, setFilterState] = useFilterState();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", status: "LEAD", contactEmail: "", currency: "USD", notes: "" });

  const load = useCallback(async () => {
    const res = await fetch("/api/clients");
    setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success("Cliente creado");
      setCreateOpen(false);
      setForm({ name: "", status: "LEAD", contactEmail: "", currency: "USD", notes: "" });
      load();
    } else toast.error("Error al crear cliente");
  }

  async function handleUpdate(id: string, patch: Partial<Client>) {
    const res = await fetch(`/api/clients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      load();
      if (selected?.id === id) setSelected((prev) => prev ? { ...prev, ...patch } : null);
    } else toast.error("Error al actualizar");
  }

  async function handleDelete(ids: string[]) {
    const results = await Promise.all(ids.map((id) => fetch(`/api/clients/${id}`, { method: "DELETE" })));
    const failed = results.filter((r) => !r.ok).length;
    if (failed > 0) toast.error(`${failed} cliente(s) no se pudo(eron) eliminar`);
    else toast.success(`${ids.length} eliminados`);
    setSelectedIds([]);
    if (selected && ids.includes(selected.id)) setSelected(null);
    load();
  }

  const filtered = applyFilter(
    data,
    filterState,
    ["name", "contactEmail"],
    { status: "status", currency: "currency" }
  );

  const columns: Column<Client>[] = [
    {
      key: "name", label: "Nombre", sortable: true,
      render: (r) => <span className="font-medium">{r.name}</span>,
      inlineEdit: (r, onSave, onCancel) => <InlineText value={r.name} onSave={(v) => { handleUpdate(r.id, { name: v }); onSave(v); }} onCancel={onCancel} />,
    },
    {
      key: "status", label: "Estado", sortable: true,
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "contactEmail", label: "Email",
      render: (r) => <span className="text-muted-foreground">{r.contactEmail ?? "—"}</span>,
    },
    {
      key: "currency", label: "Moneda",
      render: (r) => <StatusBadge status={r.currency} />,
    },
    {
      key: "projects", label: "Proyectos",
      render: (r) => <span className="tabular-nums text-muted-foreground">{r.projects?.length ?? 0}</span>,
    },
    {
      key: "invoices", label: "Facturas",
      render: (r) => <span className="tabular-nums text-muted-foreground">{r.invoices?.length ?? 0}</span>,
    },
    {
      key: "createdAt", label: "Creado", sortable: true,
      render: (r) => <span className="text-muted-foreground">{formatDate(r.createdAt)}</span>,
    },
  ];

  const kanban: KanbanConfig<Client> = {
    groups: KANBAN_GROUPS,
    groupKey: "status",
    cardRender: (r) => (
      <div className="p-3 bg-background rounded-md border border-border space-y-1.5">
        <p className="text-xs font-medium">{r.name}</p>
        {r.contactEmail && <p className="text-[11px] text-muted-foreground">{r.contactEmail}</p>}
        <div className="flex items-center gap-1.5">
          <StatusBadge status={r.currency} />
          <span className="text-[11px] text-muted-foreground">{r.projects?.length ?? 0} proj</span>
        </div>
      </div>
    ),
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold">Clientes</h1>
          <p className="text-xs text-muted-foreground">{data.length} total</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-[#0070F3] hover:bg-[#3385F5] text-white text-xs font-medium transition-colors">
            <Plus className="size-3.5" /> Nuevo Cliente
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-sm">Nuevo Cliente</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3 mt-2">
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Nombre *</label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-8 text-xs bg-background" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Estado</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground">
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Moneda</label>
                  <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground">
                    {CURRENCY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Email</label>
                <Input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className="h-8 text-xs bg-background" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Notas</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground resize-none" />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" size="sm" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                <Button type="submit" size="sm" className="bg-[#0070F3] hover:bg-[#3385F5] text-white">Crear</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <FilterBar
        state={filterState}
        onChange={setFilterState}
        placeholder="Buscar clientes..."
        filterGroups={[
          { key: "status", label: "Estado", options: STATUS_OPTIONS.map((s) => ({ key: s, label: s })) },
          { key: "currency", label: "Moneda", options: CURRENCY_OPTIONS.map((c) => ({ key: c, label: c })) },
        ]}
        sortOptions={[{ key: "name", label: "Nombre" }, { key: "createdAt", label: "Creado" }]}
      />

      {/* Data */}
      <DataView
        data={filtered}
        columns={columns}
        kanban={kanban}
        onRowClick={setSelected}
        onUpdate={handleUpdate}
        selectedIds={selectedIds}
        onSelectIds={setSelectedIds}
        isLoading={loading}
        emptyMessage="Sin clientes aún. Creá tu primer cliente."
      />

      {/* Slide-over */}
      {selected && (
        <RecordSlideOver
          open={!!selected}
          onClose={() => setSelected(null)}
          title={selected.name}
          subtitle={selected.contactEmail ?? undefined}
          badge={<StatusBadge status={selected.status} />}
          attachments={[]}
          onAttachmentsChange={() => {}}
          actions={
            <Button
              size="sm"
              variant="destructive"
              className="h-7 text-xs"
              onClick={() => handleDelete([selected.id])}
            >
              <Trash2 className="size-3.5 mr-1" /> Eliminar
            </Button>
          }
        >
          <FieldGrid>
            <FieldRow label="Estado">
              <select
                value={selected.status}
                onChange={(e) => handleUpdate(selected.id, { status: e.target.value })}
                className="w-full h-7 rounded border border-border bg-card-elevated px-2 text-xs text-foreground"
              >
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </FieldRow>
            <FieldRow label="Moneda">
              <select
                value={selected.currency}
                onChange={(e) => handleUpdate(selected.id, { currency: e.target.value })}
                className="w-full h-7 rounded border border-border bg-card-elevated px-2 text-xs text-foreground"
              >
                {CURRENCY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </FieldRow>
          </FieldGrid>
          <FieldRow label="Email de Contacto">
            <input
              defaultValue={selected.contactEmail ?? ""}
              onBlur={(e) => handleUpdate(selected.id, { contactEmail: e.target.value })}
              className="w-full h-7 rounded border border-border bg-card-elevated px-2 text-xs text-foreground"
            />
          </FieldRow>
          <FieldRow label="Notas">
            <textarea
              defaultValue={selected.notes ?? ""}
              onBlur={(e) => handleUpdate(selected.id, { notes: e.target.value })}
              rows={3}
              className="w-full rounded border border-border bg-card-elevated px-2 py-1.5 text-xs text-foreground resize-none"
            />
          </FieldRow>
          <FieldGrid>
            <FieldRow label="Proyectos">
              <span className="text-sm tabular-nums">{selected.projects?.length ?? 0}</span>
            </FieldRow>
            <FieldRow label="Facturas">
              <span className="text-sm tabular-nums">{selected.invoices?.length ?? 0}</span>
            </FieldRow>
          </FieldGrid>
          <FieldRow label="Creado">
            <span className="text-sm text-muted-foreground">{formatDate(selected.createdAt)}</span>
          </FieldRow>
        </RecordSlideOver>
      )}

      {/* Batch */}
      <BatchActionBar
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds([])}
        actions={[
          {
            label: "Eliminar",
            variant: "destructive",
            icon: <Trash2 className="size-3.5" />,
            onClick: handleDelete,
          },
        ]}
      />
    </div>
  );
}

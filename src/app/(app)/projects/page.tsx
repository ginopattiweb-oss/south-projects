"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  DataView, Column, KanbanConfig,
  RecordSlideOver, FieldRow, FieldGrid,
  StatusBadge, RelationBadge,
  FilterBar, useFilterState, applyFilter,
  BatchActionBar, CreatableSelect,
} from "@/components/shared";
import { formatDate } from "@/lib/utils-format";

type Project = {
  id: string; name: string; status: string; clientId: string; description: string | null;
  attachments: string[]; client: { id: string; name: string };
  tasks: { id: string }[]; invoices: { id: string }[]; createdAt: string;
};

type Client = { id: string; name: string };

const STATUS_OPTIONS = ["NOT_STARTED", "PLANNING", "ON_TRACK", "BEHIND", "DONE"];
const STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "Sin Empezar", PLANNING: "Planificación", ON_TRACK: "En Curso", BEHIND: "Atrasado", DONE: "Listo",
};

const KANBAN_GROUPS = [
  { key: "NOT_STARTED", label: "Sin Empezar",  color: "#9F9F9F" },
  { key: "PLANNING",    label: "Planificación", color: "#A78BFA" },
  { key: "ON_TRACK",    label: "En Curso",      color: "#10B981" },
  { key: "BEHIND",      label: "Atrasado",      color: "#EF4444" },
  { key: "DONE",        label: "Listo",         color: "#059669" },
];

export default function ProjectsPage() {
  const router = useRouter();
  const [data, setData] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Project | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterState, setFilterState] = useFilterState();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", status: "NOT_STARTED", clientId: "", description: "" });

  const load = useCallback(async () => {
    const [projRes, clientRes] = await Promise.all([fetch("/api/projects"), fetch("/api/clients")]);
    setData(await projRes.json());
    setClients(await clientRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clientId) return toast.error("Seleccioná un cliente");
    const res = await fetch("/api/projects", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { toast.success("Proyecto creado"); setCreateOpen(false); setForm({ name: "", status: "NOT_STARTED", clientId: "", description: "" }); load(); }
    else toast.error("Error al crear proyecto");
  }

  async function handleUpdate(id: string, patch: Partial<Project>) {
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) { load(); if (selected?.id === id) setSelected((p) => p ? { ...p, ...patch } : null); }
    else toast.error("Error al actualizar");
  }

  async function handleDelete(ids: string[]) {
    const results = await Promise.all(ids.map((id) => fetch(`/api/projects/${id}`, { method: "DELETE" })));
    const failed = results.filter((r) => !r.ok).length;
    if (failed > 0) toast.error(`${failed} proyecto(s) no se pudo(eron) eliminar`);
    else toast.success(`${ids.length} eliminados`);
    setSelectedIds([]);
    if (selected && ids.includes(selected.id)) setSelected(null);
    load();
  }

  const filtered = applyFilter(data, filterState, ["name"], { status: "status", clientId: "clientId" });

  const columns: Column<Project>[] = [
    {
      key: "name", label: "Nombre", sortable: true,
      render: (r) => (
        <button
          data-no-row-click
          onClick={() => router.push(`/projects/${r.id}`)}
          className="font-medium hover:text-[#0070F3] transition-colors text-left"
        >
          {r.name}
        </button>
      ),
    },
    { key: "status", label: "Estado", sortable: true, render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "client", label: "Cliente",
      render: (r) => <RelationBadge label={r.client?.name ?? "—"} />,
    },
    {
      key: "tasks", label: "Tareas",
      render: (r) => <span className="tabular-nums text-muted-foreground">{r.tasks?.length ?? 0}</span>,
    },
    {
      key: "createdAt", label: "Creado", sortable: true,
      render: (r) => <span className="text-muted-foreground">{formatDate(r.createdAt)}</span>,
    },
  ];

  const kanban: KanbanConfig<Project> = {
    groups: KANBAN_GROUPS, groupKey: "status",
    cardRender: (r) => (
      <div className="p-3 bg-background rounded-md border border-border space-y-1.5">
        <p className="text-xs font-medium">{r.name}</p>
        <RelationBadge label={r.client?.name ?? "—"} />
        <p className="text-[11px] text-muted-foreground">{r.tasks?.length ?? 0} tareas</p>
      </div>
    ),
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold">Proyectos</h1>
          <p className="text-xs text-muted-foreground">{data.length} total</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-[#0070F3] hover:bg-[#3385F5] text-white text-xs font-medium transition-colors">
            <Plus className="size-3.5" /> Nuevo Proyecto
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-card border-border">
            <DialogHeader><DialogTitle className="text-sm">Nuevo Proyecto</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3 mt-2">
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Nombre *</label>
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-8 text-xs bg-background" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Cliente *</label>
                  <CreatableSelect
                    required
                    options={clients.map((c) => ({ id: c.id, label: c.name }))}
                    value={form.clientId}
                    onChange={(id) => setForm({ ...form, clientId: id })}
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
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Estado</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground">
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Descripción</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground resize-none" />
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
        state={filterState} onChange={setFilterState} placeholder="Buscar proyectos..."
        filterGroups={[{ key: "status", label: "Estado", options: STATUS_OPTIONS.map((s) => ({ key: s, label: STATUS_LABELS[s] })) }]}
        sortOptions={[{ key: "name", label: "Nombre" }, { key: "createdAt", label: "Creado" }]}
      />

      <DataView
        data={filtered} columns={columns} kanban={kanban}
        onRowClick={setSelected} onUpdate={handleUpdate}
        selectedIds={selectedIds} onSelectIds={setSelectedIds}
        isLoading={loading} emptyMessage="Sin proyectos aún."
      />

      {selected && (
        <RecordSlideOver
          open={!!selected} onClose={() => setSelected(null)}
          title={selected.name}
          subtitle={selected.client?.name}
          badge={<StatusBadge status={selected.status} />}
          attachments={selected.attachments ?? []}
          onAttachmentsChange={(urls) => handleUpdate(selected.id, { attachments: urls } as Partial<Project>)}
          actions={
            <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => handleDelete([selected.id])}>
              <Trash2 className="size-3.5 mr-1" /> Delete
            </Button>
          }
        >
          <FieldGrid>
            <FieldRow label="Estado">
              <select value={selected.status} onChange={(e) => handleUpdate(selected.id, { status: e.target.value })}
                className="w-full h-7 rounded border border-border bg-card-elevated px-2 text-xs text-foreground">
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </FieldRow>
            <FieldRow label="Cliente">
              <select value={selected.clientId} onChange={(e) => handleUpdate(selected.id, { clientId: e.target.value })}
                className="w-full h-7 rounded border border-border bg-card-elevated px-2 text-xs text-foreground">
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FieldRow>
          </FieldGrid>
          <FieldRow label="Descripción">
            <textarea defaultValue={selected.description ?? ""} onBlur={(e) => handleUpdate(selected.id, { description: e.target.value })}
              rows={3} className="w-full rounded border border-border bg-card-elevated px-2 py-1.5 text-xs text-foreground resize-none" />
          </FieldRow>
          <FieldRow label="Tareas">
            <span className="text-sm tabular-nums">{selected.tasks?.length ?? 0}</span>
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

"use client";

import { useState, useEffect, useCallback } from "react";
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
import { formatDate, toInputDate } from "@/lib/utils-format";

type Task = {
  id: string; title: string; status: string; projectId: string; description: string | null;
  dueDate: string | null; attachments: string[];
  project: { id: string; name: string; client: { id: string; name: string } };
  createdAt: string;
};

type Project = { id: string; name: string; client: { id: string; name: string } };

const STATUS_OPTIONS = ["READY", "IN_PROGRESS", "ON_HOLD", "DONE"];
const KANBAN_GROUPS = [
  { key: "READY",       label: "Listo",      color: "#9F9F9F" },
  { key: "IN_PROGRESS", label: "En Progreso", color: "#0070F3" },
  { key: "ON_HOLD",     label: "En Espera",   color: "#F59E0B" },
  { key: "DONE",        label: "Hecho",       color: "#10B981" },
];

export default function TasksPage() {
  const [data, setData] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Task | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterState, setFilterState] = useFilterState();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: "", status: "READY", projectId: "", description: "", dueDate: "" });

  const load = useCallback(async () => {
    const [taskRes, projRes, clientRes] = await Promise.all([fetch("/api/tasks"), fetch("/api/projects"), fetch("/api/clients")]);
    setData(await taskRes.json());
    setProjects(await projRes.json());
    setClients(await clientRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.projectId) return toast.error("Seleccioná un proyecto");
    const res = await fetch("/api/tasks", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { toast.success("Tarea creada"); setCreateOpen(false); setForm({ title: "", status: "READY", projectId: "", description: "", dueDate: "" }); load(); }
    else toast.error("Error al crear tarea");
  }

  async function handleUpdate(id: string, patch: Partial<Task>) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) { load(); if (selected?.id === id) setSelected((p) => p ? { ...p, ...patch } : null); }
    else toast.error("Error al actualizar");
  }

  async function handleDelete(ids: string[]) {
    await Promise.all(ids.map((id) => fetch(`/api/tasks/${id}`, { method: "DELETE" })));
    toast.success(`${ids.length} deleted`);
    setSelectedIds([]);
    if (selected && ids.includes(selected.id)) setSelected(null);
    load();
  }

  const filtered = applyFilter(data, filterState, ["title"], { status: "status" });

  const columns: Column<Task>[] = [
    { key: "title", label: "Título", sortable: true, render: (r) => <span className="font-medium">{r.title}</span> },
    { key: "status", label: "Estado", sortable: true, render: (r) => <StatusBadge status={r.status} /> },
    { key: "project", label: "Proyecto", render: (r) => <RelationBadge label={r.project?.name ?? "—"} /> },
    { key: "client", label: "Cliente", render: (r) => <span className="text-xs text-muted-foreground">{r.project?.client?.name ?? "—"}</span> },
    { key: "dueDate", label: "Vence", sortable: true, render: (r) => <span className={`text-muted-foreground ${r.dueDate && new Date(r.dueDate) < new Date() && r.status !== "DONE" ? "text-red-400" : ""}`}>{formatDate(r.dueDate)}</span> },
    { key: "createdAt", label: "Creado", sortable: true, render: (r) => <span className="text-muted-foreground">{formatDate(r.createdAt)}</span> },
  ];

  const kanban: KanbanConfig<Task> = {
    groups: KANBAN_GROUPS, groupKey: "status",
    cardRender: (r) => (
      <div className="p-3 bg-background rounded-md border border-border space-y-1.5">
        <p className="text-xs font-medium">{r.title}</p>
        <RelationBadge label={r.project?.name ?? "—"} />
        {r.dueDate && <p className="text-[11px] text-muted-foreground">Vence {formatDate(r.dueDate)}</p>}
      </div>
    ),
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold">Tareas</h1>
          <p className="text-xs text-muted-foreground">{data.length} total</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-[#0070F3] hover:bg-[#3385F5] text-white text-xs font-medium transition-colors">
            <Plus className="size-3.5" /> Nueva Tarea
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-card border-border">
            <DialogHeader><DialogTitle className="text-sm">Nueva Tarea</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3 mt-2">
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Título *</label>
                <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-8 text-xs bg-background" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Proyecto *</label>
                  <CreatableSelect
                    required
                    options={projects.map((p) => ({ id: p.id, label: p.name }))}
                    value={form.projectId}
                    onChange={(id) => setForm({ ...form, projectId: id })}
                    createLabel="Crear proyecto"
                    secondField={{
                      label: "Cliente",
                      required: true,
                      options: clients.map((c) => ({ id: c.id, label: c.name })),
                    }}
                    onCreate={async (name, clientId) => {
                      const res = await fetch("/api/projects", {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name, clientId, status: "NOT_STARTED" }),
                      });
                      const p = await res.json();
                      return { id: p.id, label: p.name };
                    }}
                    onCreated={(o) => setProjects((prev) => [...prev, { id: o.id, name: o.label, client: { id: "", name: "" } }])}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Estado</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground">
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Fecha de Vencimiento</label>
                <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="h-8 text-xs bg-background" />
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
        state={filterState} onChange={setFilterState} placeholder="Buscar tareas..."
        filterGroups={[{ key: "status", label: "Estado", options: STATUS_OPTIONS.map((s) => ({ key: s, label: s.replace("_", " ") })) }]}
        sortOptions={[{ key: "title", label: "Título" }, { key: "dueDate", label: "Vencimiento" }, { key: "createdAt", label: "Creado" }]}
      />

      <DataView
        data={filtered} columns={columns} kanban={kanban}
        onRowClick={setSelected} onUpdate={handleUpdate}
        selectedIds={selectedIds} onSelectIds={setSelectedIds}
        isLoading={loading} emptyMessage="Sin tareas aún." defaultView="kanban"
      />

      {selected && (
        <RecordSlideOver
          open={!!selected} onClose={() => setSelected(null)}
          title={selected.title}
          subtitle={selected.project?.name}
          badge={<StatusBadge status={selected.status} />}
          attachments={selected.attachments ?? []}
          onAttachmentsChange={(urls) => handleUpdate(selected.id, { attachments: urls } as Partial<Task>)}
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
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </select>
            </FieldRow>
            <FieldRow label="Proyecto">
              <select value={selected.projectId} onChange={(e) => handleUpdate(selected.id, { projectId: e.target.value })}
                className="w-full h-7 rounded border border-border bg-card-elevated px-2 text-xs text-foreground">
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </FieldRow>
          </FieldGrid>
          <FieldRow label="Fecha de Vencimiento">
            <input type="date" defaultValue={toInputDate(selected.dueDate)}
              onBlur={(e) => handleUpdate(selected.id, { dueDate: e.target.value })}
              className="w-full h-7 rounded border border-border bg-card-elevated px-2 text-xs text-foreground" />
          </FieldRow>
          <FieldRow label="Descripción">
            <textarea defaultValue={selected.description ?? ""} onBlur={(e) => handleUpdate(selected.id, { description: e.target.value })}
              rows={4} className="w-full rounded border border-border bg-card-elevated px-2 py-1.5 text-xs text-foreground resize-none" />
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

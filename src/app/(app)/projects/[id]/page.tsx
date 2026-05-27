"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Trash2, ExternalLink, Eye, EyeOff,
  Link2, Phone, Mail, FileText, Key, Folder, Loader2, Check, X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DataView, Column, KanbanConfig,
  RecordSlideOver, FieldRow, FieldGrid,
  StatusBadge, RelationBadge,
  BatchActionBar,
} from "@/components/shared";
import { formatDate, toInputDate } from "@/lib/utils-format";

// ─── Types ────────────────────────────────────────────────────────────────────

type QuickLink   = { id: string; label: string; url: string };
type Document    = { id: string; label: string; url: string };
type ProjectFile = { id: string; type: string; label: string; url: string };

type Access = {
  id: string; service: string; username: string | null;
  password: string | null; notes: string | null;
};

type Task = {
  id: string; title: string; status: string; projectId: string;
  description: string | null; dueDate: string | null; attachments: string[];
  createdAt: string;
  project: { id: string; name: string; client: { id: string; name: string } };
};

type Invoice = {
  id: string; invoiceNumber: string; status: string; amount: number; currency: string;
};

type Project = {
  id: string; name: string; status: string; description: string | null;
  contactName: string | null; contactEmail: string | null; contactWhatsapp: string | null;
  quickLinks: QuickLink[]; documents: Document[]; projectFiles: ProjectFile[];
  tasks: Task[]; invoices: Invoice[];
  client: { id: string; name: string; accesses: Access[] };
};

// ─── Constants ────────────────────────────────────────────────────────────────

const FILE_TYPES = [
  { type: "buyer_persona",        label: "Buyer Persona" },
  { type: "oferta_irresistible",  label: "Oferta Irresistible" },
  { type: "analisis_competencia", label: "Análisis Competencia" },
  { type: "estructura",           label: "Estructura" },
  { type: "copys",                label: "Copys" },
];

const LINK_PRESETS = ["Drive", "Framer", "Web", "Brief", "Figma", "Notion"];

const TASK_STATUS_OPTIONS = ["READY", "IN_PROGRESS", "ON_HOLD", "DONE"];
const TASK_KANBAN_GROUPS = [
  { key: "READY",       label: "Listo",       color: "#9F9F9F" },
  { key: "IN_PROGRESS", label: "En Progreso", color: "#0070F3" },
  { key: "ON_HOLD",     label: "En Espera",   color: "#F59E0B" },
  { key: "DONE",        label: "Hecho",       color: "#10B981" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2); }

function SectionCard({ title, icon, children, action }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-border bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-medium">{title}</span>
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function QuickLinkButton({ link, onUpdate, onRemove }: {
  link: QuickLink;
  onUpdate: (id: string, field: "label" | "url", val: string) => void;
  onRemove: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(link.url);
  const hasUrl = !!link.url;

  function commit() {
    onUpdate(link.id, "url", draft);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="https://..."
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") { setDraft(link.url); setEditing(false); }
          }}
          onBlur={commit}
          className="h-7 text-xs px-2 rounded border border-[#0070F3] bg-background outline-none w-52 text-foreground"
        />
        <button onClick={() => { setDraft(link.url); setEditing(false); }}>
          <X className="size-3.5 text-muted-foreground" />
        </button>
      </div>
    );
  }

  return (
    <div className="group relative inline-flex">
      {hasUrl ? (
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 h-7 px-3 rounded-md border border-border bg-card-elevated text-xs font-medium text-foreground hover:border-[#0070F3] hover:text-[#0070F3] transition-colors"
        >
          {link.label}
          <ExternalLink className="size-3" />
        </a>
      ) : (
        <button
          onClick={() => { setDraft(""); setEditing(true); }}
          className="flex items-center gap-1.5 h-7 px-3 rounded-md border border-dashed border-border text-xs font-medium text-muted-foreground opacity-50 hover:opacity-80 transition-opacity"
        >
          {link.label}
          <Plus className="size-3" />
        </button>
      )}
      <button
        onClick={() => onRemove(link.id)}
        className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 flex items-center justify-center size-4 rounded-full bg-card-elevated border border-border text-muted-foreground hover:text-red-400 transition-opacity"
      >
        <X className="size-2.5" />
      </button>
    </div>
  );
}

function InlineEdit({ value, onSave, placeholder, className = "" }: {
  value: string; onSave: (v: string) => void; placeholder?: string; className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);

  function commit() { onSave(draft); setEditing(false); }
  function cancel() { setDraft(value); setEditing(false); }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          autoFocus value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") cancel(); }}
          className={`h-6 text-xs px-1.5 ${className}`}
        />
        <button onClick={commit}><Check className="size-3.5 text-emerald-400" /></button>
        <button onClick={cancel}><X className="size-3.5 text-muted-foreground" /></button>
      </div>
    );
  }
  return (
    <span
      className={`cursor-pointer hover:text-foreground transition-colors text-xs ${className}`}
      onClick={() => { setDraft(value); setEditing(true); }}
    >
      {value || <span className="text-muted-foreground italic">{placeholder}</span>}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [project, setProject]             = useState<Project | null>(null);
  const [loading, setLoading]             = useState(true);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  // Task state
  const [selectedTask, setSelectedTask]   = useState<Task | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [taskForm, setTaskForm]           = useState({ title: "", status: "READY", dueDate: "", description: "" });

  const load = useCallback(async () => {
    const res = await fetch(`/api/projects/${id}`);
    if (!res.ok) { toast.error("Proyecto no encontrado"); router.push("/projects"); return; }
    setProject(await res.json());
    setLoading(false);
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  // ── Project patch ────────────────────────────────────────────────────────

  async function patch(data: Partial<Project>) {
    const res = await fetch(`/api/projects/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) setProject((p) => p ? { ...p, ...data } : null);
    else toast.error("Error al guardar");
  }

  // ── Quick Links ──────────────────────────────────────────────────────────

  function addLink(preset?: string) {
    patch({ quickLinks: [...(project?.quickLinks ?? []), { id: uid(), label: preset ?? "Link", url: "" }] });
  }
  function updateLink(linkId: string, field: "label" | "url", val: string) {
    patch({ quickLinks: (project?.quickLinks ?? []).map((l) => l.id === linkId ? { ...l, [field]: val } : l) });
  }
  function removeLink(linkId: string) {
    patch({ quickLinks: (project?.quickLinks ?? []).filter((l) => l.id !== linkId) });
  }

  // ── Documents ────────────────────────────────────────────────────────────

  function addDocument() {
    patch({ documents: [...(project?.documents ?? []), { id: uid(), label: "Documento", url: "" }] });
  }
  function updateDocument(docId: string, field: "label" | "url", val: string) {
    patch({ documents: (project?.documents ?? []).map((d) => d.id === docId ? { ...d, [field]: val } : d) });
  }
  function removeDocument(docId: string) {
    patch({ documents: (project?.documents ?? []).filter((d) => d.id !== docId) });
  }

  // ── Project Files ────────────────────────────────────────────────────────

  function setFileUrl(type: string, label: string, url: string) {
    const existing = project?.projectFiles ?? [];
    const has = existing.find((f) => f.type === type);
    patch({
      projectFiles: has
        ? existing.map((f) => f.type === type ? { ...f, url } : f)
        : [...existing, { id: uid(), type, label, url }],
    });
  }

  // ── Accesses ─────────────────────────────────────────────────────────────

  const [newAccess, setNewAccess]       = useState({ service: "", username: "", password: "", notes: "" });
  const [addingAccess, setAddingAccess] = useState(false);

  async function createAccess() {
    if (!project || !newAccess.service) return;
    const res = await fetch(`/api/clients/${project.client.id}/accesses`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAccess),
    });
    if (res.ok) {
      toast.success("Acceso agregado");
      setNewAccess({ service: "", username: "", password: "", notes: "" });
      setAddingAccess(false);
      load();
    } else toast.error("Error al agregar acceso");
  }

  async function deleteAccess(accessId: string) {
    if (!project) return;
    const res = await fetch(`/api/clients/${project.client.id}/accesses/${accessId}`, { method: "DELETE" });
    if (res.ok) load(); else toast.error("Error al eliminar");
  }

  // ── Tasks ────────────────────────────────────────────────────────────────

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskForm.title) return;
    const res = await fetch("/api/tasks", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...taskForm, projectId: id }),
    });
    if (res.ok) {
      toast.success("Tarea creada");
      setCreateTaskOpen(false);
      setTaskForm({ title: "", status: "READY", dueDate: "", description: "" });
      load();
    } else toast.error("Error al crear tarea");
  }

  async function handleUpdateTask(taskId: string, taskPatch: Partial<Task>) {
    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskPatch),
    });
    if (res.ok) {
      load();
      if (selectedTask?.id === taskId) setSelectedTask((p) => p ? { ...p, ...taskPatch } : null);
    } else toast.error("Error al actualizar");
  }

  async function handleDeleteTask(ids: string[]) {
    const results = await Promise.all(ids.map((tid) => fetch(`/api/tasks/${tid}`, { method: "DELETE" })));
    const failed  = results.filter((r) => !r.ok).length;
    if (failed > 0) toast.error(`${failed} tarea(s) no se pudo(eron) eliminar`);
    else toast.success(`${ids.length} eliminadas`);
    setSelectedTaskIds([]);
    if (selectedTask && ids.includes(selectedTask.id)) setSelectedTask(null);
    load();
  }

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground text-xs">
        <Loader2 className="size-3.5 animate-spin" /> Cargando...
      </div>
    );
  }

  if (!project) return null;

  const taskColumns: Column<Task>[] = [
    { key: "title", label: "Título", sortable: true, render: (r) => <span className="font-medium">{r.title}</span> },
    { key: "status", label: "Estado", sortable: true, render: (r) => <StatusBadge status={r.status} /> },
    { key: "dueDate", label: "Vence", sortable: true, render: (r) => (
      <span className={`text-muted-foreground ${r.dueDate && new Date(r.dueDate) < new Date() && r.status !== "DONE" ? "text-red-400" : ""}`}>
        {formatDate(r.dueDate)}
      </span>
    )},
  ];

  const taskKanban: KanbanConfig<Task> = {
    groups: TASK_KANBAN_GROUPS, groupKey: "status",
    cardRender: (r) => (
      <div className="p-3 bg-background rounded-md border border-border space-y-1.5">
        <p className="text-xs font-medium">{r.title}</p>
        {r.dueDate && (
          <p className={`text-[11px] ${new Date(r.dueDate) < new Date() && r.status !== "DONE" ? "text-red-400" : "text-muted-foreground"}`}>
            Vence {formatDate(r.dueDate)}
          </p>
        )}
      </div>
    ),
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/projects")} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold truncate">{project.name}</h1>
          <p className="text-xs text-muted-foreground">{project.client.name}</p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Quick Links */}
        <SectionCard title="Links Rápidos" icon={<Link2 className="size-3.5 text-[#0070F3]" />}>
          <div className="space-y-3">
            {(project.quickLinks ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(project.quickLinks ?? []).map((link) => (
                  <QuickLinkButton key={link.id} link={link} onUpdate={updateLink} onRemove={removeLink} />
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {LINK_PRESETS.filter((p) => !(project.quickLinks ?? []).some((l) => l.label === p)).map((p) => (
                <button key={p} onClick={() => addLink(p)}
                  className="text-[10px] px-2 py-0.5 rounded border border-border text-muted-foreground hover:text-foreground hover:bg-card-elevated transition-colors">
                  + {p}
                </button>
              ))}
              <button onClick={() => addLink()}
                className="text-[10px] px-2 py-0.5 rounded border border-border text-muted-foreground hover:text-foreground hover:bg-card-elevated transition-colors">
                + Otro
              </button>
            </div>
          </div>
        </SectionCard>

        {/* Contact */}
        <SectionCard title="Contacto Responsable" icon={<Phone className="size-3.5 text-emerald-400" />}>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-16 shrink-0">Nombre</span>
              <InlineEdit value={project.contactName ?? ""} onSave={(v) => patch({ contactName: v })} placeholder="Nombre..." className="flex-1 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2">
              <Mail className="size-3.5 text-muted-foreground shrink-0" />
              <InlineEdit value={project.contactEmail ?? ""} onSave={(v) => patch({ contactEmail: v })} placeholder="email@..." className="flex-1 text-muted-foreground" />
              {project.contactEmail && (
                <a href={`mailto:${project.contactEmail}`} className="text-muted-foreground hover:text-foreground"><ExternalLink className="size-3.5" /></a>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Phone className="size-3.5 text-muted-foreground shrink-0" />
              <InlineEdit value={project.contactWhatsapp ?? ""} onSave={(v) => patch({ contactWhatsapp: v })} placeholder="+54 9 11..." className="flex-1 text-muted-foreground" />
              {project.contactWhatsapp && (
                <a href={`https://wa.me/${project.contactWhatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-emerald-400">
                  <ExternalLink className="size-3.5" />
                </a>
              )}
            </div>
          </div>
        </SectionCard>

        {/* Documents */}
        <SectionCard title="Documentos" icon={<FileText className="size-3.5 text-amber-400" />}>
          <div className="space-y-2">
            {project.invoices.length > 0 && (
              <div className="space-y-1.5 mb-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Facturas</p>
                {project.invoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{inv.invoiceNumber}</span>
                    <div className="flex items-center gap-2">
                      <span>{inv.amount} {inv.currency}</span>
                      <StatusBadge status={inv.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {(project.documents ?? []).map((doc) => (
              <div key={doc.id} className="flex items-center gap-2">
                <InlineEdit value={doc.label} onSave={(v) => updateDocument(doc.id, "label", v)} className="w-24 shrink-0 text-muted-foreground" />
                <InlineEdit value={doc.url} onSave={(v) => updateDocument(doc.id, "url", v)} placeholder="https://..." className="flex-1 text-muted-foreground" />
                {doc.url && (
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground"><ExternalLink className="size-3.5" /></a>
                )}
                <button onClick={() => removeDocument(doc.id)} className="text-muted-foreground hover:text-red-400"><Trash2 className="size-3.5" /></button>
              </div>
            ))}
            <button onClick={addDocument} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
              <Plus className="size-3.5" /> Agregar documento
            </button>
          </div>
        </SectionCard>

        {/* Client Accesses */}
        <SectionCard title="Accesos del Cliente" icon={<Key className="size-3.5 text-yellow-400" />}>
          <div className="space-y-2">
            {project.client.accesses.length === 0 && !addingAccess && (
              <p className="text-xs text-muted-foreground">Sin accesos.</p>
            )}
            {project.client.accesses.map((acc) => (
              <div key={acc.id} className="rounded border border-border p-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{acc.service}</span>
                  <button onClick={() => deleteAccess(acc.id)} className="text-muted-foreground hover:text-red-400"><Trash2 className="size-3" /></button>
                </div>
                {acc.username && <p className="text-[11px] text-muted-foreground">Usuario: {acc.username}</p>}
                {acc.password && (
                  <div className="flex items-center gap-1.5">
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {visiblePasswords.has(acc.id) ? acc.password : "••••••••"}
                    </p>
                    <button onClick={() => setVisiblePasswords((s) => { const n = new Set(s); n.has(acc.id) ? n.delete(acc.id) : n.add(acc.id); return n; })} className="text-muted-foreground hover:text-foreground">
                      {visiblePasswords.has(acc.id) ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                    </button>
                  </div>
                )}
                {acc.notes && <p className="text-[11px] text-muted-foreground">{acc.notes}</p>}
              </div>
            ))}
            {addingAccess ? (
              <div className="rounded border border-border p-2 space-y-1.5">
                <Input placeholder="Servicio (ej: Google Ads)" value={newAccess.service} onChange={(e) => setNewAccess((p) => ({ ...p, service: e.target.value }))} className="h-6 text-xs px-2" />
                <Input placeholder="Usuario / email" value={newAccess.username} onChange={(e) => setNewAccess((p) => ({ ...p, username: e.target.value }))} className="h-6 text-xs px-2" />
                <Input placeholder="Contraseña" type="password" value={newAccess.password} onChange={(e) => setNewAccess((p) => ({ ...p, password: e.target.value }))} className="h-6 text-xs px-2" />
                <Input placeholder="Notas" value={newAccess.notes} onChange={(e) => setNewAccess((p) => ({ ...p, notes: e.target.value }))} className="h-6 text-xs px-2" />
                <div className="flex gap-1.5">
                  <Button size="sm" onClick={createAccess} className="h-6 text-[11px] bg-[#0070F3] hover:bg-[#3385F5] text-white">Guardar</Button>
                  <Button size="sm" variant="ghost" onClick={() => setAddingAccess(false)} className="h-6 text-[11px]">Cancelar</Button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingAccess(true)} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                <Plus className="size-3.5" /> Agregar acceso
              </button>
            )}
          </div>
        </SectionCard>

        {/* Project Files */}
        <SectionCard title="Archivos del Proyecto" icon={<Folder className="size-3.5 text-blue-400" />}>
          <div className="space-y-2">
            {FILE_TYPES.map(({ type, label }) => {
              const file = (project.projectFiles ?? []).find((f) => f.type === type);
              return (
                <div key={type} className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground w-36 shrink-0">{label}</span>
                  <InlineEdit value={file?.url ?? ""} onSave={(v) => setFileUrl(type, label, v)} placeholder="Pegar link..." className="flex-1 text-muted-foreground" />
                  {file?.url && (
                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground"><ExternalLink className="size-3.5" /></a>
                  )}
                </div>
              );
            })}
          </div>
        </SectionCard>

      </div>

      {/* Tasks — full width Kanban */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Tareas ({project.tasks.length})
          </h2>
          <button
            onClick={() => setCreateTaskOpen(true)}
            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-[#0070F3] hover:bg-[#3385F5] text-white text-xs font-medium transition-colors"
          >
            <Plus className="size-3.5" /> Nueva tarea
          </button>
        </div>

        <DataView
          data={project.tasks}
          columns={taskColumns}
          kanban={taskKanban}
          onRowClick={setSelectedTask}
          onUpdate={(taskId, taskPatch) => handleUpdateTask(taskId, taskPatch as Partial<Task>)}
          selectedIds={selectedTaskIds}
          onSelectIds={setSelectedTaskIds}
          isLoading={loading}
          emptyMessage="Sin tareas en este proyecto."
          defaultView="kanban"
        />

        <BatchActionBar
          selectedIds={selectedTaskIds}
          onClearSelection={() => setSelectedTaskIds([])}
          actions={[{ label: "Eliminar", variant: "destructive", icon: <Trash2 className="size-3.5" />, onClick: handleDeleteTask }]}
        />
      </div>

      {/* Create Task Dialog */}
      <Dialog open={createTaskOpen} onOpenChange={setCreateTaskOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader><DialogTitle className="text-sm">Nueva Tarea</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateTask} className="space-y-3 mt-2">
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Título *</label>
              <Input required value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} className="h-8 text-xs bg-background" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Estado</label>
                <select value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                  className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground">
                  {TASK_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Fecha de Vencimiento</label>
                <Input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} className="h-8 text-xs bg-background" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={() => setCreateTaskOpen(false)}>Cancelar</Button>
              <Button type="submit" size="sm" className="bg-[#0070F3] hover:bg-[#3385F5] text-white">Crear</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Task SlideOver */}
      {selectedTask && (
        <RecordSlideOver
          open={!!selectedTask} onClose={() => setSelectedTask(null)}
          title={selectedTask.title}
          subtitle={project.name}
          badge={<StatusBadge status={selectedTask.status} />}
          attachments={selectedTask.attachments ?? []}
          onAttachmentsChange={(urls) => handleUpdateTask(selectedTask.id, { attachments: urls } as Partial<Task>)}
          actions={
            <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => handleDeleteTask([selectedTask.id])}>
              <Trash2 className="size-3.5 mr-1" /> Eliminar
            </Button>
          }
        >
          <FieldGrid>
            <FieldRow label="Estado">
              <select value={selectedTask.status} onChange={(e) => handleUpdateTask(selectedTask.id, { status: e.target.value })}
                className="w-full h-7 rounded border border-border bg-card-elevated px-2 text-xs text-foreground">
                {TASK_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </select>
            </FieldRow>
          </FieldGrid>
          <FieldRow label="Fecha de Vencimiento">
            <input type="date" defaultValue={toInputDate(selectedTask.dueDate)}
              onBlur={(e) => handleUpdateTask(selectedTask.id, { dueDate: e.target.value })}
              className="w-full h-7 rounded border border-border bg-card-elevated px-2 text-xs text-foreground" />
          </FieldRow>
          <FieldRow label="Descripción">
            <textarea defaultValue={selectedTask.description ?? ""} onBlur={(e) => handleUpdateTask(selectedTask.id, { description: e.target.value })}
              rows={4} className="w-full rounded border border-border bg-card-elevated px-2 py-1.5 text-xs text-foreground resize-none" />
          </FieldRow>
          <FieldRow label="Creado">
            <span className="text-sm text-muted-foreground">{formatDate(selectedTask.createdAt)}</span>
          </FieldRow>
        </RecordSlideOver>
      )}
    </div>
  );
}

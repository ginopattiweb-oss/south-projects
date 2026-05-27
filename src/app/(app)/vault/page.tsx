"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Eye, EyeOff, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  FilterBar, useFilterState, applyFilter,
  BatchActionBar, RecordSlideOver, FieldRow, FieldGrid, StatusBadge,
} from "@/components/shared";
import { formatDate } from "@/lib/utils-format";

type VaultEntry = {
  id: string; service: string; username: string | null;
  password: string | null; url: string | null; notes: string | null;
  category: string | null; createdAt: string;
};

const CATEGORIES = [
  "Redes Sociales", "Hosting", "Herramientas", "Bancos",
  "Email", "Dominios", "Clientes", "Otro",
];

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text).then(() => toast.success(`${label} copiado`));
}

export default function VaultPage() {
  const [data, setData] = useState<VaultEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<VaultEntry | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterState, setFilterState] = useFilterState();
  const [createOpen, setCreateOpen] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ service: "", username: "", password: "", url: "", notes: "", category: "" });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/vault");
      if (!res.ok) { console.error("[vault]", res.status, await res.text()); setLoading(false); return; }
      setData(await res.json());
    } catch (err) {
      console.error("[vault]", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/vault", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success("Acceso guardado");
      setCreateOpen(false);
      setForm({ service: "", username: "", password: "", url: "", notes: "", category: "" });
      load();
    } else toast.error("Error al guardar");
  }

  async function handleUpdate(id: string, patch: Partial<VaultEntry>) {
    const res = await fetch(`/api/vault/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      load();
      if (selected?.id === id) setSelected((p) => p ? { ...p, ...patch } : null);
    } else toast.error("Error al actualizar");
  }

  async function handleDelete(ids: string[]) {
    await Promise.all(ids.map((id) => fetch(`/api/vault/${id}`, { method: "DELETE" })));
    toast.success(`${ids.length} eliminados`);
    setSelectedIds([]);
    if (selected && ids.includes(selected.id)) setSelected(null);
    load();
  }

  function togglePassword(id: string) {
    setVisiblePasswords((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  const filtered = applyFilter(data, filterState, ["service", "username"], { category: "category" });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold">Bóveda</h1>
          <p className="text-xs text-muted-foreground">{data.length} accesos guardados</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-[#0070F3] hover:bg-[#3385F5] text-white text-xs font-medium transition-colors">
            <Plus className="size-3.5" /> Nuevo Acceso
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-card border-border">
            <DialogHeader><DialogTitle className="text-sm">Nuevo Acceso</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-3 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Servicio *</label>
                  <Input required value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} className="h-8 text-xs bg-background" placeholder="ej: Google Ads" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Categoría</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground">
                    <option value="">Ninguna</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground uppercase tracking-wide">URL</label>
                <Input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="h-8 text-xs bg-background" placeholder="https://..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Usuario / Email</label>
                  <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="h-8 text-xs bg-background" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Contraseña</label>
                  <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="h-8 text-xs bg-background" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Notas</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground resize-none" />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" size="sm" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                <Button type="submit" size="sm" className="bg-[#0070F3] hover:bg-[#3385F5] text-white">Guardar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <FilterBar
        state={filterState} onChange={setFilterState} placeholder="Buscar accesos..."
        filterGroups={[{ key: "category", label: "Categoría", options: CATEGORIES.map((c) => ({ key: c, label: c })) }]}
        sortOptions={[{ key: "service", label: "Servicio" }, { key: "category", label: "Categoría" }, { key: "createdAt", label: "Creado" }]}
      />

      {/* Card grid */}
      {loading ? (
        <p className="text-xs text-muted-foreground">Cargando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sin accesos guardados aún.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((entry) => {
            const isSelected = selectedIds.includes(entry.id);
            const pwVisible = visiblePasswords.has(entry.id);
            return (
              <div
                key={entry.id}
                onClick={() => setSelected(entry)}
                className={`group relative rounded-md border bg-card p-4 space-y-2.5 cursor-pointer hover:border-[#0070F3]/40 transition-colors ${isSelected ? "border-[#0070F3]/60 bg-[#0070F3]/5" : "border-border"}`}
              >
                {/* Select checkbox */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    e.stopPropagation();
                    setSelectedIds((prev) =>
                      isSelected ? prev.filter((x) => x !== entry.id) : [...prev, entry.id]
                    );
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 checked:opacity-100 accent-[#0070F3]"
                />

                {/* Header */}
                <div className="flex items-start gap-2 pr-5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{entry.service}</p>
                    {entry.category && <StatusBadge status={entry.category} />}
                  </div>
                  {entry.url && (
                    <a
                      href={entry.url} target="_blank" rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-muted-foreground hover:text-[#0070F3] shrink-0"
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </div>

                {/* Username */}
                {entry.username && (
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] text-muted-foreground w-16 shrink-0">Usuario</span>
                    <span className="text-[11px] text-foreground truncate flex-1 font-mono">{entry.username}</span>
                    <button onClick={() => copyToClipboard(entry.username!, "Usuario")} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity">
                      <Copy className="size-3" />
                    </button>
                  </div>
                )}

                {/* Password */}
                {entry.password && (
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] text-muted-foreground w-16 shrink-0">Contraseña</span>
                    <span className="text-[11px] font-mono flex-1 truncate">
                      {pwVisible ? entry.password : "••••••••••"}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => togglePassword(entry.id)} className="text-muted-foreground hover:text-foreground">
                        {pwVisible ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                      </button>
                      <button onClick={() => copyToClipboard(entry.password!, "Contraseña")} className="text-muted-foreground hover:text-foreground">
                        <Copy className="size-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Slide-over */}
      {selected && (
        <RecordSlideOver
          open={!!selected} onClose={() => setSelected(null)}
          title={selected.service}
          subtitle={selected.category ?? undefined}
          badge={selected.category ? <StatusBadge status={selected.category} /> : undefined}
          actions={
            <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => handleDelete([selected.id])}>
              <Trash2 className="size-3.5 mr-1" /> Eliminar
            </Button>
          }
        >
          <FieldGrid>
            <FieldRow label="Categoría">
              <select defaultValue={selected.category ?? ""}
                onBlur={(e) => handleUpdate(selected.id, { category: e.target.value || null })}
                className="w-full h-7 rounded border border-border bg-card-elevated px-2 text-xs text-foreground">
                <option value="">Ninguna</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </FieldRow>
            <FieldRow label="URL">
              <input defaultValue={selected.url ?? ""}
                onBlur={(e) => handleUpdate(selected.id, { url: e.target.value || null })}
                placeholder="https://..."
                className="w-full h-7 rounded border border-border bg-card-elevated px-2 text-xs text-foreground" />
            </FieldRow>
          </FieldGrid>
          <FieldRow label="Usuario / Email">
            <div className="flex items-center gap-1.5">
              <input defaultValue={selected.username ?? ""}
                onBlur={(e) => handleUpdate(selected.id, { username: e.target.value || null })}
                className="flex-1 h-7 rounded border border-border bg-card-elevated px-2 text-xs text-foreground font-mono" />
              {selected.username && (
                <button onClick={() => copyToClipboard(selected.username!, "Usuario")} className="text-muted-foreground hover:text-foreground shrink-0">
                  <Copy className="size-3.5" />
                </button>
              )}
            </div>
          </FieldRow>
          <FieldRow label="Contraseña">
            <div className="flex items-center gap-1.5">
              <input
                type={visiblePasswords.has(selected.id) ? "text" : "password"}
                defaultValue={selected.password ?? ""}
                onBlur={(e) => handleUpdate(selected.id, { password: e.target.value || null })}
                className="flex-1 h-7 rounded border border-border bg-card-elevated px-2 text-xs text-foreground font-mono" />
              <button onClick={() => togglePassword(selected.id)} className="text-muted-foreground hover:text-foreground shrink-0">
                {visiblePasswords.has(selected.id) ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
              {selected.password && (
                <button onClick={() => copyToClipboard(selected.password!, "Contraseña")} className="text-muted-foreground hover:text-foreground shrink-0">
                  <Copy className="size-3.5" />
                </button>
              )}
            </div>
          </FieldRow>
          <FieldRow label="Notas">
            <textarea defaultValue={selected.notes ?? ""} onBlur={(e) => handleUpdate(selected.id, { notes: e.target.value || null })}
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

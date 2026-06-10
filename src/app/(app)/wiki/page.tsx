"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, FileText, Loader2, Save, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type WikiPage = {
  id: string;
  title: string;
  slug: string;
  parentId: string | null;
  updatedAt: string;
};

type WikiPageFull = WikiPage & { content: string };

export default function WikiPage() {
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<WikiPageFull | null>(null);
  const [loadingPage, setLoadingPage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [dirty, setDirty] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/wiki");
      if (res.ok) setPages(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function openPage(id: string) {
    setLoadingPage(true);
    setDirty(false);
    try {
      const res = await fetch(`/api/wiki/${id}`);
      if (res.ok) {
        const page = await res.json();
        setSelected(page);
        setEditTitle(page.title);
        setEditContent(page.content);
      }
    } finally {
      setLoadingPage(false);
    }
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/wiki/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, content: editContent }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSelected(updated);
        setEditTitle(updated.title);
        setEditContent(updated.content);
        setDirty(false);
        setPages((prev) => prev.map((p) => p.id === updated.id ? { ...p, title: updated.title, updatedAt: updated.updatedAt } : p));
        toast.success("Guardado");
      } else toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function createPage() {
    if (!newTitle.trim()) return;
    try {
      const res = await fetch("/api/wiki", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      if (res.ok) {
        const page = await res.json();
        setPages((prev) => [page, ...prev]);
        setNewTitle("");
        setCreating(false);
        openPage(page.id);
        toast.success("Página creada");
      } else toast.error("Error al crear");
    } catch { toast.error("Error"); }
  }

  async function deletePage(id: string) {
    if (!confirm("¿Eliminar esta página?")) return;
    const res = await fetch(`/api/wiki/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPages((prev) => prev.filter((p) => p.id !== id));
      if (selected?.id === id) setSelected(null);
      toast.success("Eliminada");
    } else toast.error("Error al eliminar");
  }

  const roots = pages.filter((p) => !p.parentId);

  return (
    <div className="flex h-full">
      {/* Sidebar — page list */}
      <div className="w-56 shrink-0 border-r border-white/[0.06] flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">Wiki</span>
          <button
            onClick={() => setCreating(true)}
            className="size-5 rounded flex items-center justify-center text-muted-foreground hover:text-violet-400 hover:bg-white/[0.06] transition-colors"
          >
            <Plus className="size-3" />
          </button>
        </div>

        {creating && (
          <div className="px-3 py-2 border-b border-white/[0.06] space-y-1.5">
            <Input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") createPage(); if (e.key === "Escape") { setCreating(false); setNewTitle(""); } }}
              placeholder="Título de la página"
              className="h-7 text-xs bg-white/[0.04] border-white/[0.1]"
            />
            <div className="flex gap-1">
              <Button size="sm" onClick={createPage} className="h-6 text-[10px] bg-violet-600 hover:bg-violet-500 text-white flex-1">Crear</Button>
              <Button size="sm" variant="ghost" onClick={() => { setCreating(false); setNewTitle(""); }} className="h-6 text-[10px] flex-1">Cancel</Button>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-2">
          {loading ? (
            <div className="flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" /> Cargando...
            </div>
          ) : roots.length === 0 ? (
            <p className="px-4 py-3 text-xs text-muted-foreground">Sin páginas aún.</p>
          ) : (
            roots.map((page) => (
              <div key={page.id} className="group">
                <button
                  onClick={() => openPage(page.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors text-left ${
                    selected?.id === page.id
                      ? "bg-violet-500/15 text-violet-300"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                  }`}
                >
                  {selected?.id === page.id
                    ? <ChevronRight className="size-3 text-violet-400 shrink-0" />
                    : <FileText className="size-3 shrink-0" />
                  }
                  <span className="truncate flex-1">{page.title}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deletePage(page.id); }}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-400 transition-all"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </button>
              </div>
            ))
          )}
        </nav>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <FileText className="size-8 opacity-20" />
            <p className="text-xs">Seleccioná una página o creá una nueva</p>
            <Button size="sm" onClick={() => setCreating(true)}
              className="h-7 text-xs bg-violet-600 hover:bg-violet-500 text-white gap-1.5">
              <Plus className="size-3" /> Nueva página
            </Button>
          </div>
        ) : loadingPage ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="size-4 animate-spin text-violet-400" />
          </div>
        ) : (
          <>
            {/* Editor header */}
            <div className="flex items-center gap-3 px-6 py-3 border-b border-white/[0.06] shrink-0">
              <input
                value={editTitle}
                onChange={(e) => { setEditTitle(e.target.value); setDirty(true); }}
                className="flex-1 bg-transparent text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground"
                placeholder="Título de la página"
              />
              {dirty && (
                <Button size="sm" onClick={save} disabled={saving}
                  className="h-7 text-xs bg-violet-600 hover:bg-violet-500 text-white gap-1.5 shrink-0">
                  {saving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
                  Guardar
                </Button>
              )}
              <span className="text-[10px] text-muted-foreground shrink-0">
                {new Date(selected.updatedAt).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </div>

            {/* Textarea */}
            <textarea
              value={editContent}
              onChange={(e) => { setEditContent(e.target.value); setDirty(true); }}
              placeholder="Escribí el contenido de la página. Soporta texto libre, listas, y markdown básico..."
              className="flex-1 w-full bg-transparent px-6 py-4 text-sm text-foreground placeholder:text-muted-foreground/40 resize-none outline-none leading-relaxed font-mono"
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "s") {
                  e.preventDefault();
                  if (dirty) save();
                }
              }}
            />

            {/* Footer hint */}
            <div className="px-6 py-2 border-t border-white/[0.06] shrink-0">
              <p className="text-[10px] text-muted-foreground">⌘S para guardar · Markdown soportado</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

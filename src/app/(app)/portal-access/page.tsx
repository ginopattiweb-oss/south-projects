"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, ExternalLink, Key, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ClientUser = {
  id: string;
  email: string;
  clientId: string;
  client: { id: string; name: string };
  createdAt: string;
};

type Client = { id: string; name: string };

export default function PortalAccessPage() {
  const [users, setUsers] = useState<ClientUser[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", clientId: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [uRes, cRes] = await Promise.all([fetch("/api/client-users"), fetch("/api/clients")]);
      const [uData, cData] = await Promise.all([uRes.json(), cRes.json()]);
      if (Array.isArray(uData)) setUsers(uData);
      if (Array.isArray(cData)) setClients(cData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email || !form.password || !form.clientId) return toast.error("Completá todos los campos");
    setSaving(true);
    try {
      const res = await fetch("/api/client-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Acceso creado");
        setOpen(false);
        setForm({ email: "", password: "", clientId: "" });
        load();
      } else {
        const err = await res.json();
        toast.error(err.error ?? "Error al crear");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, email: string) {
    if (!confirm(`¿Eliminar acceso de ${email}?`)) return;
    const res = await fetch(`/api/client-users/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Acceso eliminado"); load(); }
    else toast.error("Error al eliminar");
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold">Portal de Clientes</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Administrá el acceso de clientes a su panel</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/portal"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg glass text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="size-3" /> Ver portal
          </a>
          <Button size="sm" onClick={() => setOpen(true)}
            className="h-8 text-xs bg-violet-600 hover:bg-violet-500 text-white gap-1.5">
            <Plus className="size-3.5" /> Nuevo acceso
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="glass rounded-xl p-4 text-xs text-muted-foreground space-y-1">
        <p className="text-foreground font-medium text-[11px] uppercase tracking-widest mb-2">¿Cómo funciona?</p>
        <p>1. Creá un usuario con email y contraseña para el cliente.</p>
        <p>2. Compartile la URL <span className="text-violet-400 font-mono">south-projects.vercel.app/login</span> con sus credenciales.</p>
        <p>3. El cliente ingresa y ve solo sus proyectos, tareas y facturas.</p>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
          <Loader2 className="size-3.5 animate-spin" /> Cargando...
        </div>
      ) : users.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center space-y-2">
          <Key className="size-6 text-muted-foreground/30 mx-auto" />
          <p className="text-xs text-muted-foreground">Sin accesos creados aún.</p>
        </div>
      ) : (
        <div className="glass rounded-xl overflow-hidden">
          <div className="grid grid-cols-3 px-4 py-2 border-b border-white/[0.06]">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Email</p>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Cliente</p>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Creado</p>
          </div>
          {users.map((u) => (
            <div key={u.id} className="grid grid-cols-3 px-4 py-3 border-b border-white/[0.05] last:border-0 items-center group hover:bg-white/[0.02] transition-colors">
              <p className="text-xs font-medium">{u.email}</p>
              <p className="text-xs text-muted-foreground">{u.client.name}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {new Date(u.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                </p>
                <button onClick={() => handleDelete(u.id, u.email)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-400 transition-all">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm glass border-white/[0.12]">
          <DialogHeader>
            <DialogTitle className="text-sm">Nuevo acceso de cliente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3 mt-2">
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground uppercase tracking-widest">Cliente *</label>
              <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} required
                className="w-full h-8 rounded-lg border border-white/[0.1] bg-white/[0.04] px-2 text-xs text-foreground">
                <option value="">Seleccionar cliente...</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground uppercase tracking-widest">Email *</label>
              <Input required type="email" placeholder="cliente@empresa.com"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="h-8 text-xs bg-white/[0.04] border-white/[0.1]" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground uppercase tracking-widest">Contraseña *</label>
              <Input required type="text" placeholder="contraseña para el cliente"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="h-8 text-xs bg-white/[0.04] border-white/[0.1]" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} className="flex-1 h-8 text-xs">Cancelar</Button>
              <Button type="submit" size="sm" disabled={saving}
                className="flex-1 h-8 text-xs bg-violet-600 hover:bg-violet-500 text-white">
                {saving ? <Loader2 className="size-3.5 animate-spin" /> : "Crear acceso"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

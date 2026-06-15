"use client";

import { useEffect, useState } from "react";
import { Loader2, FolderKanban, CheckSquare, FileText, ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils-format";
import { StatusBadge } from "@/components/shared";

type Task = { id: string; title: string; status: string; dueDate: string | null };
type Invoice = { id: string; invoiceNumber: string; status: string; amount: number; currency: string; dueDate: string | null };
type Project = { id: string; name: string; status: string; description: string | null; tasks: Task[]; invoices: Invoice[] };
type ClientData = { id: string; name: string; projects: Project[] };

export default function PortalPage() {
  const [data, setData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/me").then((r) => r.json()).then((d) => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="size-5 animate-spin text-violet-400" />
    </div>
  );

  if (!data || !data.projects) return (
    <p className="text-sm text-muted-foreground">No se pudieron cargar los datos.</p>
  );

  const totalInvoiced = data.projects.flatMap((p) => p.invoices).reduce((s, i) => s + i.amount, 0);
  const totalPaid     = data.projects.flatMap((p) => p.invoices).filter((i) => i.status === "PAID").reduce((s, i) => s + i.amount, 0);
  const totalPending  = data.projects.flatMap((p) => p.invoices).filter((i) => i.status === "PENDING").reduce((s, i) => s + i.amount, 0);
  const activeTasks   = data.projects.flatMap((p) => p.tasks).filter((t) => t.status === "IN_PROGRESS").length;

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-semibold">{data.name}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Panel de seguimiento de proyectos</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass rounded-xl p-4">
          <FolderKanban className="size-4 text-violet-400 mb-2" />
          <p className="text-2xl font-bold">{data.projects.length}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Proyectos</p>
        </div>
        <div className="glass rounded-xl p-4">
          <CheckSquare className="size-4 text-emerald-400 mb-2" />
          <p className="text-2xl font-bold">{activeTasks}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Tareas activas</p>
        </div>
        <div className="glass rounded-xl p-4">
          <FileText className="size-4 text-amber-400 mb-2" />
          <p className="text-xl font-bold tabular-nums text-emerald-400">{formatCurrency(totalPaid)}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Pagado</p>
        </div>
        <div className="glass rounded-xl p-4">
          <FileText className="size-4 text-rose-400 mb-2" />
          <p className="text-xl font-bold tabular-nums text-amber-400">{formatCurrency(totalPending)}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Pendiente</p>
        </div>
      </div>

      {/* Projects */}
      <div className="space-y-4">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Proyectos</h2>
        {data.projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin proyectos aún.</p>
        ) : (
          data.projects.map((project) => (
            <Link key={project.id} href={`/portal/project/${project.id}`}
              className="glass rounded-xl p-5 flex items-center justify-between group hover:border-violet-500/25 transition-all block">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <p className="text-sm font-medium">{project.name}</p>
                  <StatusBadge status={project.status} />
                </div>
                {project.description && (
                  <p className="text-xs text-muted-foreground">{project.description}</p>
                )}
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                  <span>{project.tasks.length} tareas · {project.tasks.filter((t) => t.status === "DONE").length} completadas</span>
                  <span>{project.invoices.length} facturas · {formatCurrency(project.invoices.reduce((s, i) => s + i.amount, 0))}</span>
                </div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-violet-400 transition-colors shrink-0" />
            </Link>
          ))
        )}
      </div>

      {/* All invoices */}
      {data.projects.flatMap((p) => p.invoices).length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Facturas</h2>
          <div className="glass rounded-xl overflow-hidden">
            {data.projects.flatMap((p) =>
              p.invoices.map((inv) => ({
                ...inv,
                projectName: p.name,
              }))
            ).sort((a, b) => new Date(b.dueDate ?? "").getTime() - new Date(a.dueDate ?? "").getTime())
              .map((inv) => (
                <div key={inv.id} className="flex items-center justify-between px-5 py-3 border-b border-white/[0.05] last:border-0">
                  <div>
                    <p className="text-xs font-medium">{inv.invoiceNumber}</p>
                    <p className="text-[11px] text-muted-foreground">{inv.projectName}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-medium tabular-nums">{formatCurrency(inv.amount, inv.currency)}</span>
                    <StatusBadge status={inv.status} />
                  </div>
                </div>
              ))}
          </div>
          <div className="text-right text-xs text-muted-foreground">
            Total: <span className="font-medium text-foreground">{formatCurrency(totalInvoiced)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

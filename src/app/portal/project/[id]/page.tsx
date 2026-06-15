"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, ArrowLeft, CheckCircle2, Circle, Clock } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils-format";
import { StatusBadge } from "@/components/shared";

type Task = { id: string; title: string; status: string; description: string | null; dueDate: string | null };
type Invoice = { id: string; invoiceNumber: string; status: string; amount: number; currency: string; dueDate: string | null; notes: string | null };
type Project = { id: string; name: string; status: string; description: string | null; tasks: Task[]; invoices: Invoice[] };
type ClientData = { id: string; name: string; projects: Project[] };

const TASK_ICON: Record<string, React.ReactNode> = {
  DONE:        <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />,
  IN_PROGRESS: <Clock className="size-4 text-violet-400 shrink-0" />,
  READY:       <Circle className="size-4 text-muted-foreground shrink-0" />,
  ON_HOLD:     <Circle className="size-4 text-amber-400 shrink-0" />,
};

export default function PortalProjectPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/me")
      .then((r) => r.json())
      .then((d: ClientData) => {
        const proj = d.projects?.find((p) => p.id === id) ?? null;
        setProject(proj);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="size-5 animate-spin text-violet-400" />
    </div>
  );

  if (!project) return (
    <div className="space-y-3">
      <Link href="/portal" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
        <ArrowLeft className="size-3" /> Volver
      </Link>
      <p className="text-sm text-muted-foreground">Proyecto no encontrado.</p>
    </div>
  );

  const done    = project.tasks.filter((t) => t.status === "DONE").length;
  const progress = project.tasks.length > 0 ? Math.round((done / project.tasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/portal" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mb-3">
          <ArrowLeft className="size-3" /> Volver al panel
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">{project.name}</h1>
          <StatusBadge status={project.status} />
        </div>
        {project.description && (
          <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
        )}
      </div>

      {/* Progress */}
      {project.tasks.length > 0 && (
        <div className="glass rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Progreso</p>
            <p className="text-sm font-semibold">{progress}%</p>
          </div>
          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">{done} de {project.tasks.length} tareas completadas</p>
        </div>
      )}

      {/* Tasks */}
      <div className="space-y-3">
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Tareas</h2>
        {project.tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin tareas aún.</p>
        ) : (
          <div className="glass rounded-xl overflow-hidden divide-y divide-white/[0.05]">
            {project.tasks.map((task) => (
              <div key={task.id} className="flex items-start gap-3 px-5 py-3.5">
                {TASK_ICON[task.status] ?? <Circle className="size-4 text-muted-foreground shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium ${task.status === "DONE" ? "line-through text-muted-foreground" : ""}`}>
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{task.description}</p>
                  )}
                </div>
                {task.dueDate && (
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(task.dueDate).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoices */}
      {project.invoices.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Facturas</h2>
          <div className="glass rounded-xl overflow-hidden divide-y divide-white/[0.05]">
            {project.invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-xs font-medium">{inv.invoiceNumber}</p>
                  {inv.notes && <p className="text-[11px] text-muted-foreground mt-0.5">{inv.notes}</p>}
                  {inv.dueDate && (
                    <p className="text-[11px] text-muted-foreground">
                      Fecha: {new Date(inv.dueDate).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold tabular-nums">{formatCurrency(inv.amount, inv.currency)}</span>
                  <StatusBadge status={inv.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

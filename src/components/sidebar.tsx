"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  FileText,
  RefreshCw,
  Receipt,
  BookOpen,
  Settings,
  LogOut,
  BarChart2,
  KeyRound,
  FileSignature,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard",     label: "Panel",         icon: LayoutDashboard },
  { href: "/clients",       label: "Clientes",      icon: Users },
  { href: "/projects",      label: "Proyectos",     icon: FolderKanban },
  { href: "/tasks",         label: "Tareas",        icon: CheckSquare },
  { href: "/finances",      label: "Finanzas",      icon: BarChart2 },
  { href: "/invoices",      label: "Facturas",      icon: FileText },
  { href: "/quotes",        label: "Cotizaciones",  icon: FileSignature },
  { href: "/subscriptions", label: "Suscripciones", icon: RefreshCw },
  { href: "/expenses",      label: "Gastos",        icon: Receipt },
  { href: "/vault",         label: "Bóveda",        icon: KeyRound },
  { href: "/wiki",          label: "Wiki",          icon: BookOpen },
  { href: "/settings",      label: "Ajustes",       icon: Settings },
];

interface SidebarProps {
  userEmail?: string | null;
}

export function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const initials = userEmail
    ? userEmail.slice(0, 2).toUpperCase()
    : "SP";

  return (
    <aside className="flex flex-col w-52 shrink-0 h-full glass-sidebar">
      {/* Brand */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center glow-violet shrink-0">
            <span className="text-[10px] font-bold text-white tracking-tight">SP</span>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-foreground tracking-wide">SOUTH</p>
            <p className="text-[9px] text-muted-foreground -mt-0.5 tracking-widest uppercase">Projects</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-3 h-px bg-white/[0.06]" />

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150",
                active
                  ? "bg-violet-500/15 text-violet-300"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-violet-400 glow-sm" />
              )}
              <Icon className={cn("size-3.5 shrink-0", active ? "text-violet-400" : "")} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="mx-3 h-px bg-white/[0.06]" />

      {/* Footer — user */}
      <div className="px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="size-7 rounded-full bg-gradient-to-br from-violet-500/40 to-violet-800/40 border border-violet-500/30 flex items-center justify-center shrink-0">
            <span className="text-[9px] font-semibold text-violet-300">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium text-foreground truncate">Gino Patti</p>
            <p className="text-[9px] text-muted-foreground truncate">{userEmail ?? ""}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="size-3" />
          </button>
        </div>
      </div>
    </aside>
  );
}

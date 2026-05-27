"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
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
  Sun,
  Moon,
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
];

const BOTTOM_NAV = [
  { href: "/settings", label: "Configuración", icon: Settings },
];

interface SidebarProps {
  userEmail?: string | null;
}

export function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <aside className="flex flex-col w-52 shrink-0 h-full bg-background border-r border-border">
      {/* Brand */}
      <div className="px-4 py-4 border-b border-border">
        <span className="text-xs font-bold tracking-widest text-foreground uppercase">
          South Projects
        </span>
        <p className="text-[10px] text-muted-foreground mt-0.5">Sistema de Negocio</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-2 rounded text-xs font-medium transition-colors",
              isActive(href)
                ? "bg-[#0070F3]/10 text-[#0070F3]"
                : "text-muted-foreground hover:text-foreground hover:bg-card-elevated"
            )}
          >
            <Icon className="size-3.5 shrink-0" />
            {label}
          </Link>
        ))}

        <div className="pt-3 mt-3 border-t border-border space-y-0.5">
          {BOTTOM_NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2 rounded text-xs font-medium transition-colors",
                isActive(href)
                  ? "bg-[#0070F3]/10 text-[#0070F3]"
                  : "text-muted-foreground hover:text-foreground hover:bg-card-elevated"
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              {label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border">
        {userEmail && (
          <p className="text-[10px] text-muted-foreground truncate mb-2">{userEmail}</p>
        )}
        <div className="flex items-center justify-between">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="size-3.5" />
            Cerrar sesión
          </button>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-card-elevated transition-colors"
            aria-label="Cambiar tema"
          >
            {theme === "dark" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
          </button>
        </div>
      </div>
    </aside>
  );
}

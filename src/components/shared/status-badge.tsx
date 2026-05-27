"use client";

import { cn } from "@/lib/utils";

interface StatusConfig {
  label: string;
  className: string;
}

const CONFIG: Record<string, StatusConfig> = {
  // ClientStatus
  LEAD:        { label: "Lead",        className: "bg-zinc-800 text-zinc-300 border border-zinc-700" },
  ACTIVE:      { label: "Active",      className: "bg-blue-500/10 text-blue-400 border border-blue-500/20" },
  PAUSED:      { label: "Paused",      className: "bg-amber-500/10 text-amber-400 border border-amber-500/20" },
  COMPLETED:   { label: "Completed",   className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
  ARCHIVED:    { label: "Archived",    className: "bg-zinc-900 text-zinc-500 border border-zinc-800" },
  // ProjectStatus
  NOT_STARTED: { label: "Not Started", className: "bg-zinc-800 text-zinc-300 border border-zinc-700" },
  PLANNING:    { label: "Planning",    className: "bg-purple-500/10 text-purple-400 border border-purple-500/20" },
  ON_TRACK:    { label: "On Track",    className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
  BEHIND:      { label: "Behind",      className: "bg-red-500/10 text-red-400 border border-red-500/20" },
  DONE:        { label: "Done",        className: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25" },
  // TaskStatus
  READY:       { label: "Ready",       className: "bg-zinc-800 text-zinc-300 border border-zinc-700" },
  IN_PROGRESS: { label: "In Progress", className: "bg-blue-500/10 text-blue-400 border border-blue-500/20" },
  ON_HOLD:     { label: "On Hold",     className: "bg-amber-500/10 text-amber-400 border border-amber-500/20" },
  // InvoiceStatus
  DRAFT:       { label: "Draft",       className: "bg-zinc-800 text-zinc-300 border border-zinc-700" },
  PENDING:     { label: "Pending",     className: "bg-amber-500/10 text-amber-400 border border-amber-500/20" },
  PAID:        { label: "Paid",        className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" },
  CANCELED:    { label: "Canceled",    className: "bg-red-500/10 text-red-400 border border-red-500/20" },
  // SubscriptionStatus
  CANCELLED:   { label: "Cancelled",   className: "bg-red-500/10 text-red-400 border border-red-500/20" },
  // BillingCycle
  MONTHLY:     { label: "Monthly",     className: "bg-zinc-800 text-zinc-300 border border-zinc-700" },
  ANNUAL:      { label: "Annual",      className: "bg-purple-500/10 text-purple-400 border border-purple-500/20" },
  // Currency
  USD:         { label: "USD",         className: "bg-zinc-800 text-zinc-300 border border-zinc-700" },
  ARS:         { label: "ARS",         className: "bg-zinc-800 text-zinc-300 border border-zinc-700" },
  EUR:         { label: "EUR",         className: "bg-zinc-800 text-zinc-300 border border-zinc-700" },
  BTC:         { label: "BTC",         className: "bg-amber-500/10 text-amber-400 border border-amber-500/20" },
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = CONFIG[status] ?? { label: status, className: "bg-zinc-800 text-zinc-400 border border-zinc-700" };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium leading-none tracking-wide",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

export function RelationBadge({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium leading-none",
        "bg-[#0070F3]/10 text-[#0070F3] border border-[#0070F3]/20",
        className
      )}
    >
      {label}
    </span>
  );
}

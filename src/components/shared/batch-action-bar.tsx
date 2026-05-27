"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface BatchAction {
  label: string;
  icon?: React.ReactNode;
  variant?: "default" | "destructive";
  onClick: (ids: string[]) => void;
}

interface BatchActionBarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  actions: BatchAction[];
  className?: string;
}

export function BatchActionBar({
  selectedIds,
  onClearSelection,
  actions,
  className,
}: BatchActionBarProps) {
  if (!selectedIds.length) return null;

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
        "flex items-center gap-2 px-4 py-2.5 rounded-lg",
        "bg-card-elevated border border-border shadow-xl shadow-black/50",
        className
      )}
    >
      <span className="text-xs text-muted-foreground mr-1 pr-3 border-r border-border">
        <span className="text-foreground font-medium">{selectedIds.length}</span>{" "}
        seleccionados
      </span>

      {actions.map((action) => (
        <Button
          key={action.label}
          size="sm"
          variant={action.variant === "destructive" ? "destructive" : "outline"}
          className="h-7 text-xs gap-1.5"
          onClick={() => action.onClick(selectedIds)}
        >
          {action.icon}
          {action.label}
        </Button>
      ))}

      <button
        onClick={onClearSelection}
        className="ml-1 text-muted-foreground hover:text-foreground"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

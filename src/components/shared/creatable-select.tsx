"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Option { id: string; label: string; }

interface SecondField {
  label: string;
  options: Option[];
  placeholder?: string;
  required?: boolean;
}

interface CreatableSelectProps {
  options: Option[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  createLabel?: string;
  onCreate?: (name: string, secondValue?: string) => Promise<Option>;
  onCreated?: (option: Option) => void;
  secondField?: SecondField;
}

export function CreatableSelect({
  options, value, onChange, placeholder = "Seleccionar...",
  required, className, createLabel = "Crear nuevo",
  onCreate, onCreated, secondField,
}: CreatableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [secondValue, setSecondValue] = useState("");
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 10);
  }, [open]);

  const selected = options.find((o) => o.id === value);
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  function select(id: string) {
    onChange(id);
    setOpen(false);
    setSearch("");
  }

  function openDialog() {
    setOpen(false);
    setSearch("");
    setName("");
    setSecondValue("");
    setDialogOpen(true);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !onCreate) return;
    setLoading(true);
    try {
      const newOption = await onCreate(name.trim(), secondValue || undefined);
      onChange(newOption.id);
      onCreated?.(newOption);
      setDialogOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div ref={containerRef} className={cn("relative", className)}>
        {/* Trigger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full h-8 flex items-center justify-between px-2 rounded-md border border-border bg-background text-xs hover:bg-card-elevated transition-colors"
        >
          <span className={selected ? "text-foreground" : "text-muted-foreground"}>
            {selected?.label ?? placeholder}
          </span>
          <ChevronDown
            className={cn("size-3.5 text-muted-foreground transition-transform shrink-0", open && "rotate-180")}
          />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-md border border-border bg-card shadow-lg shadow-black/20 overflow-hidden">
            {/* Search input */}
            <div className="p-1.5 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
                  className="w-full h-6 pl-6 pr-2 rounded text-xs bg-background border border-border outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Options */}
            <div className="max-h-44 overflow-y-auto">
              {!required && (
                <button
                  type="button"
                  onClick={() => select("")}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-xs hover:bg-card-elevated transition-colors",
                    !value ? "text-foreground font-medium" : "text-muted-foreground"
                  )}
                >
                  {placeholder}
                </button>
              )}
              {filtered.length === 0 && (
                <p className="px-3 py-2 text-xs text-muted-foreground">Sin resultados</p>
              )}
              {filtered.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => select(o.id)}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-card-elevated transition-colors",
                    value === o.id ? "text-[#0070F3]" : "text-foreground"
                  )}
                >
                  {o.label}
                  {value === o.id && <Check className="size-3 shrink-0" />}
                </button>
              ))}
            </div>

            {/* Create option */}
            {onCreate && (
              <div className="border-t border-border">
                <button
                  type="button"
                  onClick={openDialog}
                  className="w-full text-left px-3 py-1.5 text-xs text-[#0070F3] hover:bg-card-elevated flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="size-3" /> {createLabel}...
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-xs bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm">{createLabel}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3 mt-2">
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground uppercase tracking-wide">Nombre *</label>
              <Input
                required autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 text-xs bg-background"
                placeholder="Nombre..."
              />
            </div>
            {secondField && (
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground uppercase tracking-wide">
                  {secondField.label}{secondField.required ? " *" : ""}
                </label>
                <select
                  required={secondField.required}
                  value={secondValue}
                  onChange={(e) => setSecondValue(e.target.value)}
                  className="w-full h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
                >
                  <option value="">{secondField.placeholder ?? "Seleccionar..."}</option>
                  {secondField.options.map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit" size="sm" disabled={loading}
                className="bg-[#0070F3] hover:bg-[#3385F5] text-white"
              >
                {loading ? "..." : "Crear"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

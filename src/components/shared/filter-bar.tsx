"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface FilterOption {
  key: string;
  label: string;
}

export interface FilterGroup {
  key: string;
  label: string;
  options: FilterOption[];
}

export interface SortOption {
  key: string;
  label: string;
}

export interface FilterState {
  search: string;
  filters: Record<string, string[]>;
  sortKey: string;
  sortDir: "asc" | "desc";
}

interface FilterBarProps {
  filterGroups?: FilterGroup[];
  sortOptions?: SortOption[];
  state: FilterState;
  onChange: (state: FilterState) => void;
  className?: string;
  placeholder?: string;
}

export function FilterBar({
  filterGroups = [],
  sortOptions = [],
  state,
  onChange,
  className,
  placeholder = "Search...",
}: FilterBarProps) {
  const activeFilterCount = Object.values(state.filters).flat().length;

  function setSearch(search: string) {
    onChange({ ...state, search });
  }

  function toggleFilter(groupKey: string, optionKey: string) {
    const current = state.filters[groupKey] ?? [];
    const next = current.includes(optionKey)
      ? current.filter((k) => k !== optionKey)
      : [...current, optionKey];
    onChange({ ...state, filters: { ...state.filters, [groupKey]: next } });
  }

  function setSort(key: string) {
    if (state.sortKey === key) {
      onChange({ ...state, sortDir: state.sortDir === "asc" ? "desc" : "asc" });
    } else {
      onChange({ ...state, sortKey: key, sortDir: "asc" });
    }
  }

  function clearAll() {
    onChange({ ...state, search: "", filters: {} });
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Search */}
      <div className="relative flex-1 max-w-64">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={state.search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          className="pl-8 h-8 text-sm bg-card border-border"
        />
        {state.search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* Filters */}
      {filterGroups.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-transparent text-xs font-medium hover:bg-card-elevated transition-colors"
          >
            <SlidersHorizontal className="size-3.5" />
            Filtrar
            {activeFilterCount > 0 && (
              <span className="bg-[#0070F3] text-white rounded-full px-1.5 text-[10px] font-bold ml-0.5">
                {activeFilterCount}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {filterGroups.map((group) => (
              <div key={group.key}>
                <DropdownMenuLabel className="text-xs text-muted-foreground font-medium">
                  {group.label}
                </DropdownMenuLabel>
                {group.options.map((opt) => (
                  <DropdownMenuCheckboxItem
                    key={opt.key}
                    checked={(state.filters[group.key] ?? []).includes(opt.key)}
                    onCheckedChange={() => toggleFilter(group.key, opt.key)}
                    className="text-xs"
                  >
                    {opt.label}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
              </div>
            ))}
            {activeFilterCount > 0 && (
              <button
                onClick={clearAll}
                className="w-full text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 text-left"
              >
                Limpiar filtros
              </button>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Sort */}
      {sortOptions.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border bg-transparent text-xs font-medium hover:bg-card-elevated transition-colors"
          >
            Ordenar
            {state.sortKey && (
              <span className="text-muted-foreground ml-1">
                {sortOptions.find((s) => s.key === state.sortKey)?.label}{" "}
                {state.sortDir === "asc" ? "↑" : "↓"}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {sortOptions.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSort(opt.key)}
                className={cn(
                  "w-full text-left text-xs px-2 py-1.5 rounded hover:bg-card-elevated",
                  state.sortKey === opt.key && "text-[#0070F3]"
                )}
              >
                {opt.label}
                {state.sortKey === opt.key && (
                  <span className="ml-1">{state.sortDir === "asc" ? "↑" : "↓"}</span>
                )}
              </button>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Clear */}
      {(activeFilterCount > 0 || state.search) && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs text-muted-foreground hover:text-foreground"
          onClick={clearAll}
        >
          <X className="size-3.5 mr-1" />
          Limpiar
        </Button>
      )}
    </div>
  );
}

export function useFilterState(defaults?: Partial<FilterState>): [FilterState, (s: FilterState) => void] {
  const [state, setState] = useState<FilterState>({
    search: "",
    filters: {},
    sortKey: "",
    sortDir: "asc",
    ...defaults,
  });
  return [state, setState];
}

export function applyFilter<T extends Record<string, unknown>>(
  data: T[],
  state: FilterState,
  searchFields: (keyof T)[],
  filterFields: Record<string, keyof T>
): T[] {
  let result = data;

  if (state.search) {
    const q = state.search.toLowerCase();
    result = result.filter((row) =>
      searchFields.some((f) => String(row[f] ?? "").toLowerCase().includes(q))
    );
  }

  for (const [groupKey, values] of Object.entries(state.filters)) {
    if (!values.length) continue;
    const field = filterFields[groupKey];
    if (!field) continue;
    result = result.filter((row) => values.includes(String(row[field])));
  }

  if (state.sortKey) {
    result = [...result].sort((a, b) => {
      const av = String(a[state.sortKey] ?? "");
      const bv = String(b[state.sortKey] ?? "");
      return state.sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }

  return result;
}

"use client";

import { useState, useRef, useCallback } from "react";
import { Table2, Columns, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { KanbanView, KanbanGroup } from "./kanban-view";

export type ViewMode = "table" | "kanban";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  className?: string;
  render: (row: T) => React.ReactNode;
  inlineEdit?: (row: T, onSave: (value: unknown) => void, onCancel: () => void) => React.ReactNode;
}

export interface KanbanConfig<T extends { id: string }> {
  groups: KanbanGroup[];
  groupKey: keyof T;
  cardRender: (item: T) => React.ReactNode;
}

interface DataViewProps<T extends { id: string }> {
  data: T[];
  columns: Column<T>[];
  kanban?: KanbanConfig<T>;
  onRowClick?: (row: T) => void;
  onUpdate?: (id: string, data: Partial<T>) => void;
  selectedIds?: string[];
  onSelectIds?: (ids: string[]) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  defaultView?: ViewMode;
  className?: string;
}

interface SortState {
  key: string;
  dir: "asc" | "desc";
}

export function DataView<T extends { id: string }>({
  data,
  columns,
  kanban,
  onRowClick,
  onUpdate,
  selectedIds = [],
  onSelectIds,
  isLoading,
  emptyMessage = "No records found",
  defaultView = "table",
  className,
}: DataViewProps<T>) {
  const [view, setView] = useState<ViewMode>(defaultView);
  const [sort, setSort] = useState<SortState | null>(null);
  const [editCell, setEditCell] = useState<{ id: string; key: string } | null>(null);

  function toggleSort(key: string) {
    if (sort?.key === key) {
      setSort({ key, dir: sort.dir === "asc" ? "desc" : "asc" });
    } else {
      setSort({ key, dir: "asc" });
    }
  }

  const sortedData = sort
    ? [...data].sort((a, b) => {
        const av = String((a as Record<string, unknown>)[sort.key] ?? "");
        const bv = String((b as Record<string, unknown>)[sort.key] ?? "");
        return sort.dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      })
    : data;

  const allSelected = data.length > 0 && selectedIds.length === data.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  function toggleAll() {
    if (allSelected) {
      onSelectIds?.([]);
    } else {
      onSelectIds?.(data.map((r) => r.id));
    }
  }

  function toggleRow(id: string) {
    if (selectedIds.includes(id)) {
      onSelectIds?.(selectedIds.filter((x) => x !== id));
    } else {
      onSelectIds?.([...selectedIds, id]);
    }
  }

  function handleInlineSave(row: T, col: Column<T>, value: unknown) {
    onUpdate?.(row.id, { [col.key]: value } as Partial<T>);
    setEditCell(null);
  }

  function handleKanbanMove(id: string, newGroup: string) {
    const col = kanban!;
    onUpdate?.(id, { [col.groupKey]: newGroup } as Partial<T>);
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-1">
        {kanban && (
          <div className="flex items-center rounded border border-border overflow-hidden">
            <button
              onClick={() => setView("table")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 text-xs transition-colors",
                view === "table"
                  ? "bg-card-elevated text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Table2 className="size-3.5" />
              Tabla
            </button>
            <button
              onClick={() => setView("kanban")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 text-xs transition-colors border-l border-border",
                view === "kanban"
                  ? "bg-card-elevated text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Columns className="size-3.5" />
              Tablero
            </button>
          </div>
        )}
      </div>

      {/* Views */}
      {view === "table" ? (
        <TableView
          data={sortedData}
          columns={columns}
          sort={sort}
          onSort={toggleSort}
          selectedIds={selectedIds}
          allSelected={allSelected}
          someSelected={someSelected}
          onToggleAll={onSelectIds ? toggleAll : undefined}
          onToggleRow={onSelectIds ? toggleRow : undefined}
          onRowClick={onRowClick}
          editCell={editCell}
          onEditCell={setEditCell}
          onInlineSave={handleInlineSave}
          isLoading={isLoading}
          emptyMessage={emptyMessage}
        />
      ) : (
        kanban && (
          <KanbanView
            data={sortedData}
            groups={kanban.groups}
            groupKey={kanban.groupKey}
            cardRender={kanban.cardRender}
            onMove={handleKanbanMove}
            onCardClick={onRowClick}
          />
        )
      )}
    </div>
  );
}

interface TableViewProps<T extends { id: string }> {
  data: T[];
  columns: Column<T>[];
  sort: SortState | null;
  onSort: (key: string) => void;
  selectedIds: string[];
  allSelected: boolean;
  someSelected: boolean;
  onToggleAll?: () => void;
  onToggleRow?: (id: string) => void;
  onRowClick?: (row: T) => void;
  editCell: { id: string; key: string } | null;
  onEditCell: (cell: { id: string; key: string } | null) => void;
  onInlineSave: (row: T, col: Column<T>, value: unknown) => void;
  isLoading?: boolean;
  emptyMessage: string;
}

function TableView<T extends { id: string }>({
  data,
  columns,
  sort,
  onSort,
  selectedIds,
  allSelected,
  someSelected,
  onToggleAll,
  onToggleRow,
  onRowClick,
  editCell,
  onEditCell,
  onInlineSave,
  isLoading,
  emptyMessage,
}: TableViewProps<T>) {
  return (
    <div className="rounded-md border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border bg-card">
              {onToggleAll && (
                <th className="w-10 px-3 py-2.5">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={onToggleAll}
                    data-state={someSelected ? "indeterminate" : allSelected ? "checked" : "unchecked"}
                    className="border-zinc-600"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "px-3 py-2.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap",
                    col.sortable && "cursor-pointer select-none hover:text-foreground",
                    col.width,
                    col.className
                  )}
                  onClick={() => col.sortable && onSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      <span className="text-zinc-600">
                        {sort?.key === col.key ? (
                          sort.dir === "asc" ? (
                            <ChevronUp className="size-3" />
                          ) : (
                            <ChevronDown className="size-3" />
                          )
                        ) : (
                          <ChevronsUpDown className="size-3" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length + (onToggleAll ? 1 : 0)}
                  className="px-3 py-12 text-center text-xs text-muted-foreground"
                >
                  Cargando...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onToggleAll ? 1 : 0)}
                  className="px-3 py-12 text-center text-xs text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => {
                const isSelected = selectedIds.includes(row.id);
                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-b border-border last:border-0 transition-colors",
                      isSelected ? "bg-[#0070F3]/5" : i % 2 === 0 ? "bg-card" : "bg-background",
                      onRowClick && "cursor-pointer hover:bg-card-elevated"
                    )}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('[data-no-row-click]')) return;
                      if (editCell) return;
                      onRowClick?.(row);
                    }}
                  >
                    {onToggleRow && (
                      <td className="w-10 px-3 py-2" data-no-row-click>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => onToggleRow(row.id)}
                          className="border-zinc-600"
                        />
                      </td>
                    )}
                    {columns.map((col) => {
                      const isEditing =
                        editCell?.id === row.id && editCell?.key === col.key;
                      return (
                        <td
                          key={col.key}
                          className={cn("px-3 py-2 text-xs", col.className)}
                          onDoubleClick={(e) => {
                            if (!col.inlineEdit) return;
                            e.stopPropagation();
                            onEditCell({ id: row.id, key: col.key });
                          }}
                        >
                          {isEditing && col.inlineEdit ? (
                            <div data-no-row-click onClick={(e) => e.stopPropagation()}>
                              {col.inlineEdit(
                                row,
                                (val) => onInlineSave(row, col, val),
                                () => onEditCell(null)
                              )}
                            </div>
                          ) : (
                            col.render(row)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

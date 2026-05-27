"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface KanbanGroup {
  key: string;
  label: string;
  color?: string;
}

export interface KanbanViewProps<T extends { id: string }> {
  data: T[];
  groups: KanbanGroup[];
  groupKey: keyof T;
  cardRender: (item: T, isDragging?: boolean) => React.ReactNode;
  onMove: (id: string, newGroup: string) => void;
  onCardClick?: (item: T) => void;
}

function SortableCard<T extends { id: string }>({
  item,
  cardRender,
  onClick,
}: {
  item: T;
  cardRender: (item: T, isDragging?: boolean) => React.ReactNode;
  onClick?: (item: T) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      {...attributes}
      {...listeners}
      onClick={() => onClick?.(item)}
      className="cursor-grab active:cursor-grabbing"
    >
      {cardRender(item, isDragging)}
    </div>
  );
}

export function KanbanView<T extends { id: string }>({
  data,
  groups,
  groupKey,
  cardRender,
  onMove,
  onCardClick,
}: KanbanViewProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function getGroupItems(groupKey_: KanbanGroup) {
    return data.filter((item) => String(item[groupKey]) === groupKey_.key);
  }

  function findGroupForId(id: string): string | undefined {
    return data.find((item) => item.id === id)?.[groupKey] as string | undefined;
  }

  const activeItem = activeId ? data.find((d) => d.id === activeId) : null;

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;

    const activeGroup = findGroupForId(active.id as string);
    // over.id can be a group container id or a card id
    const overGroupKey = groups.find((g) => g.key === over.id)?.key
      ?? findGroupForId(over.id as string);

    if (!overGroupKey || activeGroup === overGroupKey) return;
    onMove(active.id as string, overGroupKey);
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const activeGroup = findGroupForId(active.id as string);
    const overGroup =
      groups.find((g) => g.key === over.id)?.key ?? findGroupForId(over.id as string);
    if (!overGroup || activeGroup === overGroup) return;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="flex gap-3 overflow-x-auto pb-4 h-full">
        {groups.map((group) => {
          const items = getGroupItems(group);
          return (
            <KanbanColumn
              key={group.key}
              group={group}
              items={items}
              cardRender={cardRender}
              onCardClick={onCardClick}
            />
          );
        })}
      </div>
      <DragOverlay>
        {activeItem ? (
          <div className="rotate-1 scale-105 opacity-95">
            {cardRender(activeItem, true)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn<T extends { id: string }>({
  group,
  items,
  cardRender,
  onCardClick,
}: {
  group: KanbanGroup;
  items: T[];
  cardRender: (item: T, isDragging?: boolean) => React.ReactNode;
  onCardClick?: (item: T) => void;
}) {
  return (
    <div
      className="flex flex-col min-w-64 w-64 bg-card rounded-lg border border-border"
      data-group-id={group.key}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          {group.color && (
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: group.color }}
            />
          )}
          <span className="text-xs font-medium text-foreground">{group.label}</span>
        </div>
        <span className="text-[11px] text-muted-foreground tabular-nums">{items.length}</span>
      </div>

      {/* Cards */}
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div
          id={group.key}
          className={cn(
            "flex-1 p-2 space-y-2 min-h-24 overflow-y-auto",
            "transition-colors duration-150"
          )}
        >
          {items.map((item) => (
            <SortableCard
              key={item.id}
              item={item}
              cardRender={cardRender}
              onClick={onCardClick}
            />
          ))}
          {items.length === 0 && (
            <div className="flex items-center justify-center h-16 text-[11px] text-zinc-600 border border-dashed border-zinc-800 rounded">
              Empty
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

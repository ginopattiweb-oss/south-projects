"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { AttachmentZone } from "./attachment-zone";
import { cn } from "@/lib/utils";

interface RecordSlideOverProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  attachments?: string[];
  onAttachmentsChange?: (urls: string[]) => void;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}

export function RecordSlideOver({
  open,
  onClose,
  title,
  subtitle,
  children,
  attachments,
  onAttachmentsChange,
  actions,
  badge,
  className,
}: RecordSlideOverProps) {
  const hasAttachments = attachments !== undefined && onAttachmentsChange !== undefined;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        className={cn(
          "w-[480px] max-w-full p-0 bg-card border-l border-border flex flex-col",
          className
        )}
        side="right"
      >
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-0 space-y-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-sm font-semibold truncate">{title}</SheetTitle>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
              )}
            </div>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>
          {actions && (
            <div className="flex items-center gap-2 pt-3">{actions}</div>
          )}
        </SheetHeader>

        <Separator className="mt-4" />

        {/* Content */}
        {hasAttachments ? (
          <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
            <TabsList className="mx-5 mt-2 w-auto justify-start h-8 bg-transparent border-b border-border rounded-none gap-0 p-0">
              <TabsTrigger
                value="details"
                className="h-8 rounded-none border-b-2 border-transparent data-[state=active]:border-[#0070F3] data-[state=active]:text-foreground text-muted-foreground text-xs px-3"
              >
                Detalles
              </TabsTrigger>
              <TabsTrigger
                value="attachments"
                className="h-8 rounded-none border-b-2 border-transparent data-[state=active]:border-[#0070F3] data-[state=active]:text-foreground text-muted-foreground text-xs px-3"
              >
                Adjuntos
                {attachments.length > 0 && (
                  <span className="ml-1.5 bg-zinc-700 text-zinc-300 text-[10px] rounded px-1">
                    {attachments.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="flex-1 min-h-0 mt-0">
              <ScrollArea className="h-full">
                <div className="px-5 py-4 space-y-4">{children}</div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="attachments" className="flex-1 min-h-0 mt-0">
              <ScrollArea className="h-full">
                <div className="px-5 py-4">
                  <AttachmentZone
                    attachments={attachments}
                    onAttachmentsChange={onAttachmentsChange}
                  />
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        ) : (
          <ScrollArea className="flex-1">
            <div className="px-5 py-4 space-y-4">{children}</div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ── Field helpers for slide-over detail rows ───────────────────────────────── */

export function FieldRow({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

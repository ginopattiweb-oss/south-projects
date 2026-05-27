"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Download, Plus, X, Save, Trash2, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils-format";

// ─── Types ────────────────────────────────────────────────────────────────────

type ListItem = { text: string; sub?: string[] };
type InfoBox  = { label: string; value: string };
type FaqItem  = { question: string; answer: string };

type QuoteData = {
  clientName: string;
  date: string;
  proposalTitle: string;
  objectiveIntro: string;
  objectives: ListItem[];
  services: ListItem[];
  infoBoxes: InfoBox[];
  totalLabel: string;
  totalValue: string;
  faqItems: FaqItem[];
  guaranteeText: string;
  showPortfolio: boolean;
  phone: string;
  website: string;
};

function toListItems(arr: (string | ListItem)[]): ListItem[] {
  return arr.map((i) => (typeof i === "string" ? { text: i } : i));
}

const DEFAULT: QuoteData = {
  clientName: "",
  date: new Date().toISOString().split("T")[0],
  proposalTitle: "Propuesta de estrategia web para",
  objectiveIntro: "Desarrollo de un sitio web institucional que permita:",
  objectives: [
    { text: "Comunicar de manera clara su propuesta educativa." },
    { text: "Presentar información clave para alumnos, padres y futuros interesados." },
    { text: "Ofrecer un diseño moderno, accesible y fácil de navegar." },
    { text: "Facilitar el contacto con la institución." },
  ],
  services: [
    { text: "Diseño y desarrollo web personalizado en WordPress/Framer." },
    { text: "Estructura de hasta 6 secciones principales." },
    { text: "Optimización para dispositivos móviles (responsive)." },
    { text: "Integración con formularios de contacto y WhatsApp." },
    { text: "Optimización SEO básica (estructura, metadatos, indexación)." },
    { text: "Posibilidad de autogestión para actualización de noticias/eventos." },
    { text: "Soporte inicial post lanzamiento para ajustes." },
  ],
  infoBoxes: [
    { label: "Valor del servicio", value: "USD 550" },
    { label: "Tiempo de entrega", value: "De 15 a 21 días" },
  ],
  totalLabel: "Total de honorarios",
  totalValue: "USD 550",
  faqItems: [
    {
      question: "¿Cuánto tiempo tardará en realizarse el proyecto?",
      answer: "Este proyecto tomará de 15 a 21 días en realizarse, 7 días para el diseño y 7 días para el montaje y la optimización, partiendo desde el momento en que nos pasen todo el material que necesitamos.",
    },
    {
      question: "¿Cómo son las formas de pago?",
      answer: "Para comenzar sería el 50% del valor del proyecto y 50% cuando el proyecto esté listo y aprobado. Si se paga el 100% del monto por adelantado hay un 10% de descuento.",
    },
    {
      question: "¿Qué métodos de pago manejan?",
      answer: "Manejamos transferencia bancaria, PayPal o efectivo.",
    },
    {
      question: "¿Qué necesitamos de su parte?",
      answer: "• Videos, fotografías y logos en alta calidad.\n• Información relevante de todo lo que tenga que ver con el servicio.\n• Logos, colores, manual de marca o cualquier cosa relacionada con la marca.",
    },
  ],
  guaranteeText:
    "Incluye 7 días de soporte gratuito después del lanzamiento para resolver cualquier detalle técnico o ajustar elementos menores.",
  showPortfolio: true,
  phone: "+2922 45-3154",
  website: "gp-webstudio.com",
};

// ─── DynamicList ──────────────────────────────────────────────────────────────

function DynamicList({
  items, onChangeItem, onAdd, onRemove, onAddSub, onChangeSub, onRemoveSub, placeholder,
}: {
  items: ListItem[];
  onChangeItem: (i: number, v: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
  onAddSub: (i: number) => void;
  onChangeSub: (i: number, j: number, v: string) => void;
  onRemoveSub: (i: number, j: number) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      {items.map((item, i) => (
        <div key={i}>
          <div className="flex gap-1.5 items-center">
            <Input value={item.text} onChange={(e) => onChangeItem(i, e.target.value)}
              placeholder={placeholder} className="h-7 text-xs bg-background flex-1" />
            <button type="button" onClick={() => onAddSub(i)} title="Agregar subitem"
              className="text-muted-foreground hover:text-[#0070F3] transition-colors">
              <Plus className="size-3" />
            </button>
            <button type="button" onClick={() => onRemove(i)}
              className="text-muted-foreground hover:text-destructive transition-colors">
              <X className="size-3.5" />
            </button>
          </div>
          {item.sub && item.sub.length > 0 && (
            <div className="ml-5 mt-1 space-y-1 border-l border-border pl-2">
              {item.sub.map((s, j) => (
                <div key={j} className="flex gap-1.5 items-center">
                  <span className="text-[10px] text-muted-foreground shrink-0">–</span>
                  <Input value={s} onChange={(e) => onChangeSub(i, j, e.target.value)}
                    placeholder="Subitem..." className="h-6 text-xs bg-background flex-1" />
                  <button type="button" onClick={() => onRemoveSub(i, j)}
                    className="text-muted-foreground hover:text-destructive transition-colors">
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      <button type="button" onClick={onAdd}
        className="text-[11px] text-[#0070F3] hover:underline flex items-center gap-0.5">
        <Plus className="size-3" /> Agregar
      </button>
    </div>
  );
}

// ─── Collapsible section wrapper ──────────────────────────────────────────────

function Section({ label, children, defaultOpen = true }: { label: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-border pt-4 mt-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full mb-3"
      >
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        {open ? <ChevronUp className="size-3 text-muted-foreground" /> : <ChevronDown className="size-3 text-muted-foreground" />}
      </button>
      {open && <div className="space-y-3">{children}</div>}
    </div>
  );
}

// ─── Template helpers ─────────────────────────────────────────────────────────

function RenderListItems({ items, baseSize = "11.5px" }: { items: ListItem[]; baseSize?: string }) {
  return (
    <>
      {items.map((item, i) => (
        <li key={i} style={{
          fontSize: baseSize, color: "#333", paddingLeft: "12px",
          position: "relative", marginBottom: item.sub?.length ? "4px" : "3px",
        }}>
          <span style={{ position: "absolute", left: 0 }}>•</span>
          {item.text}
          {item.sub && item.sub.length > 0 && (
            <ul style={{ paddingLeft: 0, listStyle: "none", marginTop: "2px" }}>
              {item.sub.map((s, j) => (
                <li key={j} style={{ fontSize: "11px", color: "#444", paddingLeft: "14px", position: "relative", marginBottom: "2px" }}>
                  <span style={{ position: "absolute", left: 0 }}>–</span>{s}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </>
  );
}

function RenderFaqAnswer({ answer }: { answer: string }) {
  const lines = answer.split("\n").filter((l) => l.trim());
  const hasBullets = lines.some((l) => /^[•\-·]/.test(l.trim()));

  if (hasBullets) {
    return (
      <ul style={{ paddingLeft: 0, listStyle: "none", margin: "0 0 14px" }}>
        {lines.map((line, i) => {
          const isBullet = /^[•\-·]/.test(line.trim());
          const text = isBullet ? line.trim().slice(1).trim() : line.trim();
          return (
            <li key={i} style={{ fontSize: "12px", color: "#444", paddingLeft: isBullet ? "12px" : "0", position: "relative", marginBottom: "3px" }}>
              {isBullet && <span style={{ position: "absolute", left: 0 }}>•</span>}
              {text}
            </li>
          );
        })}
      </ul>
    );
  }

  return <p style={{ fontSize: "12px", color: "#444", margin: "0 0 14px", whiteSpace: "pre-wrap" }}>{answer}</p>;
}

// ─── Quote Template ───────────────────────────────────────────────────────────

function QuoteTemplate({ data }: { data: QuoteData }) {
  const formattedDate = data.date
    ? (() => {
        const d = new Date(data.date + "T12:00:00");
        return d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      })()
    : "";

  const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

  const badge = (text: string, extra?: React.CSSProperties) => (
    <span style={{
      backgroundColor: "#0a0a0a", color: "#ffffff",
      padding: "5px 13px", borderRadius: "5px",
      fontSize: "11px", fontWeight: "600", display: "inline-block", ...extra,
    }}>
      {text}
    </span>
  );

  const showImportantes = data.faqItems.length > 0 || data.guaranteeText;
  const PORTFOLIO_LABELS = ["Landing pages", "Landing pages", "Institucional", "Tienda online", "Diapositivas"];

  return (
    <div style={{
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      width: "210mm", minHeight: "297mm", backgroundColor: "#ffffff", color: "#0a0a0a",
      margin: "0", padding: "0", boxSizing: "border-box",
      display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{ padding: "32px 40px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: "15px", fontWeight: "800", lineHeight: "1.15", letterSpacing: "-0.01em" }}>
          GP-<br />WEB<br />STUDIO
        </div>
        <div style={{ backgroundColor: "#0a0a0a", color: "#ffffff", padding: "8px 22px", borderRadius: "6px", fontSize: "13px", fontWeight: "600" }}>
          Cotización
        </div>
      </div>

      {/* Scrollable content — grows to fill page */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Client + Date */}
        <div style={{ padding: "0 40px 20px", display: "grid", gridTemplateColumns: "1fr auto", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "10px", color: "#888", marginBottom: "5px" }}>Nombre del cliente</div>
            <div style={{ border: "1px solid #e5e5e5", borderRadius: "6px", padding: "7px 12px", fontSize: "13px" }}>{data.clientName || " "}</div>
          </div>
          <div style={{ minWidth: "210px" }}>
            <div style={{ fontSize: "10px", color: "#888", marginBottom: "5px" }}>Fecha</div>
            <div style={{ border: "1px solid #e5e5e5", borderRadius: "6px", padding: "7px 12px", fontSize: "13px" }}>{capitalize(formattedDate) || " "}</div>
          </div>
        </div>

        {/* Main card */}
        <div style={{ margin: "0 40px 20px", border: "1px solid #e5e5e5", borderRadius: "12px", padding: "22px 24px" }}>
          <div style={{ marginBottom: "18px" }}>
            {badge(`${data.proposalTitle}${data.clientName ? " " + data.clientName : ""}`)}
          </div>
          <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: "700", fontSize: "12px", marginBottom: "6px" }}>Objetivo del proyecto:</div>
              <div style={{ fontSize: "11.5px", color: "#333", marginBottom: "6px" }}>{data.objectiveIntro}</div>
              <ul style={{ paddingLeft: 0, listStyle: "none", margin: "0 0 18px" }}>
                <RenderListItems items={data.objectives} />
              </ul>
              <div style={{ fontWeight: "700", fontSize: "12px", marginBottom: "6px" }}>Este servicio incluye:</div>
              <ul style={{ paddingLeft: 0, listStyle: "none", margin: 0 }}>
                <RenderListItems items={data.services} />
              </ul>
            </div>
            {data.infoBoxes.length > 0 && (
              <div style={{ width: "175px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                {data.infoBoxes.map((box, i) => (
                  <div key={i} style={{ border: "1px solid #e5e5e5", borderRadius: "8px", padding: "12px 14px" }}>
                    {badge(box.label, { fontSize: "10px", padding: "3px 10px", borderRadius: "4px", display: "block" })}
                    <div style={{ fontSize: "15px", fontWeight: "700", marginTop: "8px" }}>{box.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Total */}
        <div style={{ margin: "0 40px 28px", border: "1px solid #e5e5e5", borderRadius: "8px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "16px" }}>
          {badge(data.totalLabel || "Total de honorarios")}
          <span style={{ fontSize: "15px", fontWeight: "700" }}>{data.totalValue}</span>
        </div>

        {/* Importantes (FAQ + guarantee) */}
        {showImportantes && (
          <div style={{ padding: "0 40px 28px" }}>
            <div style={{ marginBottom: "22px" }}>{badge("Importantes")}</div>

            {data.faqItems.map((item, i) => (
              <div key={i}>
                <h2 style={{ fontSize: "15px", fontWeight: "700", margin: "0 0 8px" }}>{item.question}</h2>
                <RenderFaqAnswer answer={item.answer} />
                {(i < data.faqItems.length - 1 || data.guaranteeText) && (
                  <hr style={{ border: "none", borderTop: "1px solid #e5e5e5", margin: "0 0 16px" }} />
                )}
              </div>
            ))}

            {data.guaranteeText && (
              <>
                <h2 style={{ fontSize: "15px", fontWeight: "700", margin: "0 0 8px" }}>Garantía de resultados</h2>
                <p style={{ fontSize: "12px", color: "#444", margin: 0 }}>{data.guaranteeText}</p>
              </>
            )}
          </div>
        )}

      </div>{/* end flex-1 */}

      {/* Bottom — always pinned to page bottom */}
      <div style={{ marginTop: "auto" }}>
        {/* Portfolio strip */}
        {data.showPortfolio && (
          <div style={{ display: "flex" }}>
            {PORTFOLIO_LABELS.map((label, i) => (
              <div key={i} style={{ flex: 1, height: "88px", backgroundColor: i % 2 === 0 ? "#181818" : "#242424", display: "flex", alignItems: "flex-end", padding: "8px" }}>
                <span style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#fff", padding: "2px 7px", borderRadius: "3px", fontSize: "9px", fontWeight: "500" }}>{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: "12px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", color: "#888" }}>
          <div>Todos los derechos<br />reservados 2025®</div>
          <div style={{ textAlign: "right" }}>Wpp / Cel: {data.phone}<br />{data.website}</div>
        </div>

        {/* Gradient bar */}
        <div style={{ height: "7px", background: "linear-gradient(to right, #a855f7, #6366f1, #3b82f6, #06b6d4)" }} />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type SavedQuote = { id: string; clientName: string; createdAt: string; updatedAt: string; data: QuoteData };
type ListKey = "objectives" | "services";

const LABEL = "text-[11px] text-muted-foreground uppercase tracking-wide";

export default function QuotesPage() {
  const [form, setForm] = useState<QuoteData>(DEFAULT);
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const templateRef = useRef<HTMLDivElement>(null);

  const loadQuotes = useCallback(async () => {
    const res = await fetch("/api/quotes");
    if (res.ok) setSavedQuotes(await res.json());
  }, []);

  useEffect(() => { loadQuotes(); }, [loadQuotes]);

  function set<K extends keyof QuoteData>(key: K, value: QuoteData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // ── List helpers ────────────────────────────────────────────────────────────
  function listUpdate(key: ListKey, i: number, text: string) {
    setForm((f) => ({ ...f, [key]: f[key].map((item, idx) => idx === i ? { ...item, text } : item) }));
  }
  function listAdd(key: ListKey) {
    setForm((f) => ({ ...f, [key]: [...f[key], { text: "" }] }));
  }
  function listRemove(key: ListKey, i: number) {
    setForm((f) => ({ ...f, [key]: f[key].filter((_, idx) => idx !== i) }));
  }
  function listAddSub(key: ListKey, i: number) {
    setForm((f) => ({ ...f, [key]: f[key].map((item, idx) => idx === i ? { ...item, sub: [...(item.sub ?? []), ""] } : item) }));
  }
  function listChangeSub(key: ListKey, i: number, j: number, v: string) {
    setForm((f) => ({ ...f, [key]: f[key].map((item, idx) => idx === i ? { ...item, sub: item.sub?.map((s, si) => si === j ? v : s) } : item) }));
  }
  function listRemoveSub(key: ListKey, i: number, j: number) {
    setForm((f) => ({ ...f, [key]: f[key].map((item, idx) => idx === i ? { ...item, sub: item.sub?.filter((_, si) => si !== j) } : item) }));
  }

  // ── Info boxes ──────────────────────────────────────────────────────────────
  function boxUpdate(i: number, field: keyof InfoBox, v: string) {
    setForm((f) => ({ ...f, infoBoxes: f.infoBoxes.map((b, idx) => idx === i ? { ...b, [field]: v } : b) }));
  }
  function boxAdd() {
    setForm((f) => ({ ...f, infoBoxes: [...f.infoBoxes, { label: "", value: "" }] }));
  }
  function boxRemove(i: number) {
    setForm((f) => ({ ...f, infoBoxes: f.infoBoxes.filter((_, idx) => idx !== i) }));
  }

  // ── FAQ items ───────────────────────────────────────────────────────────────
  function faqUpdate(i: number, field: keyof FaqItem, v: string) {
    setForm((f) => ({ ...f, faqItems: f.faqItems.map((item, idx) => idx === i ? { ...item, [field]: v } : item) }));
  }
  function faqAdd() {
    setForm((f) => ({ ...f, faqItems: [...f.faqItems, { question: "", answer: "" }] }));
  }
  function faqRemove(i: number) {
    setForm((f) => ({ ...f, faqItems: f.faqItems.filter((_, idx) => idx !== i) }));
  }
  function faqMove(i: number, dir: -1 | 1) {
    const arr = [...form.faqItems];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setForm((f) => ({ ...f, faqItems: arr }));
  }

  // ── Save / load / delete ────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    try {
      const payload = { clientName: form.clientName || "Sin nombre", data: form };
      if (activeId) {
        const res = await fetch(`/api/quotes/${activeId}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) { toast.success("Cotización actualizada"); loadQuotes(); }
        else toast.error("Error al guardar");
      } else {
        const res = await fetch("/api/quotes", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const q = await res.json();
          setActiveId(q.id);
          toast.success("Cotización guardada");
          loadQuotes();
        } else toast.error("Error al guardar");
      }
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/quotes/${id}`, { method: "DELETE" });
    if (activeId === id) { setActiveId(null); setForm(DEFAULT); }
    toast.success("Eliminada");
    loadQuotes();
  }

  function loadQuote(q: SavedQuote) {
    const d = q.data as QuoteData & { price?: string; currency?: string; deliveryTime?: string; timelineAnswer?: string; paymentTermsAnswer?: string; paymentMethodsAnswer?: string; materialsNeeded?: (string | ListItem)[] };

    const infoBoxes: InfoBox[] = d.infoBoxes ?? [
      ...(d.price ? [{ label: "Valor del servicio", value: `${d.currency ?? "USD"} ${d.price}` }] : []),
      ...(d.deliveryTime ? [{ label: "Tiempo de entrega", value: d.deliveryTime }] : []),
    ];

    const faqItems: FaqItem[] = d.faqItems ?? [
      ...(d.timelineAnswer ? [{ question: "¿Cuánto tiempo tardará en realizarse el proyecto?", answer: d.timelineAnswer }] : []),
      ...(d.paymentTermsAnswer ? [{ question: "¿Cómo son las formas de pago?", answer: d.paymentTermsAnswer }] : []),
      ...(d.paymentMethodsAnswer ? [{ question: "¿Qué métodos de pago manejan?", answer: d.paymentMethodsAnswer }] : []),
      ...(d.materialsNeeded?.length ? [{
        question: "¿Qué necesitamos de su parte?",
        answer: toListItems(d.materialsNeeded).map((i) => `• ${i.text}`).join("\n"),
      }] : []),
    ];

    setForm({
      ...d,
      objectives: toListItems(d.objectives as unknown as (string | ListItem)[]),
      services: toListItems(d.services as unknown as (string | ListItem)[]),
      infoBoxes,
      totalValue: d.totalValue ?? (d.price ? `${d.currency ?? "USD"} ${d.price}` : ""),
      totalLabel: d.totalLabel ?? "Total de honorarios",
      faqItems,
      guaranteeText: d.guaranteeText ?? "",
      showPortfolio: d.showPortfolio ?? true,
    });
    setActiveId(q.id);
  }

  function newQuote() { setForm(DEFAULT); setActiveId(null); }

  function handleDownload() {
    const el = templateRef.current;
    if (!el) return;
    const win = window.open("", "_blank");
    if (!win) { toast.error("Pop-ups bloqueados. Permitilos para descargar el PDF."); return; }
    win.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Cotización — ${form.clientName || "GP-Web Studio"}</title>
<style>
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: white; width: 210mm; }
  @media print { @page { margin: 0; size: A4 portrait; } html, body { width: 210mm; } }
</style>
</head><body>${el.outerHTML}</body></html>`);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 350);
  }

  function listProps(key: ListKey) {
    return {
      items: form[key],
      onChangeItem: (i: number, v: string) => listUpdate(key, i, v),
      onAdd: () => listAdd(key),
      onRemove: (i: number) => listRemove(key, i),
      onAddSub: (i: number) => listAddSub(key, i),
      onChangeSub: (i: number, j: number, v: string) => listChangeSub(key, i, j, v),
      onRemoveSub: (i: number, j: number) => listRemoveSub(key, i, j),
    };
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Form panel ───────────────────────────────────── */}
      <div className="w-[400px] shrink-0 border-r border-border overflow-y-auto">
        <div className="p-5 space-y-4">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-sm font-semibold">Cotizaciones</h1>
              <p className="text-xs text-muted-foreground mt-0.5">{activeId ? "Editando cotización guardada" : "Nueva cotización"}</p>
            </div>
            <div className="flex gap-1.5">
              <Button onClick={handleSave} disabled={saving} size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                <Save className="size-3.5" />{saving ? "..." : activeId ? "Actualizar" : "Guardar"}
              </Button>
              <Button onClick={handleDownload} size="sm" className="bg-[#0070F3] hover:bg-[#3385F5] text-white h-8 gap-1.5 text-xs">
                <Download className="size-3.5" /> PDF
              </Button>
            </div>
          </div>

          {/* Saved quotes */}
          {savedQuotes.length > 0 && (
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-card-elevated border-b border-border">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Guardadas ({savedQuotes.length})</span>
                <button onClick={newQuote} className="text-[11px] text-[#0070F3] hover:underline">+ Nueva</button>
              </div>
              <div className="max-h-44 overflow-y-auto divide-y divide-border">
                {savedQuotes.map((q) => (
                  <div key={q.id} onClick={() => loadQuote(q)}
                    className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-card-elevated transition-colors ${activeId === q.id ? "bg-[#0070F3]/10" : ""}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="size-3 shrink-0 text-muted-foreground" />
                      <span className="text-xs font-medium truncate">{q.clientName}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{formatDate(q.updatedAt)}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(q.id); }}
                      className="text-muted-foreground hover:text-destructive transition-colors ml-2 shrink-0">
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cliente + Fecha */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className={LABEL}>Cliente</label>
              <Input value={form.clientName} onChange={(e) => set("clientName", e.target.value)} placeholder="Colegio San Pablo" className="h-8 text-xs bg-background" />
            </div>
            <div className="space-y-1">
              <label className={LABEL}>Fecha</label>
              <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className="h-8 text-xs bg-background" />
            </div>
          </div>

          {/* Propuesta */}
          <Section label="Propuesta">
            <div className="space-y-1">
              <label className={LABEL}>Título</label>
              <Input value={form.proposalTitle} onChange={(e) => set("proposalTitle", e.target.value)} className="h-8 text-xs bg-background" />
            </div>
            <div className="space-y-1">
              <label className={LABEL}>Intro del objetivo</label>
              <Input value={form.objectiveIntro} onChange={(e) => set("objectiveIntro", e.target.value)} className="h-8 text-xs bg-background" />
            </div>
            <div className="space-y-1.5">
              <label className={LABEL}>Objetivos</label>
              <DynamicList {...listProps("objectives")} placeholder="Objetivo..." />
            </div>
            <div className="space-y-1.5">
              <label className={LABEL}>Servicios incluidos</label>
              <DynamicList {...listProps("services")} placeholder="Servicio..." />
            </div>
          </Section>

          {/* Cajas de info */}
          <Section label="Cajas de info (derecha)">
            <div className="space-y-2">
              {form.infoBoxes.map((box, i) => (
                <div key={i} className="flex gap-1.5 items-center">
                  <Input value={box.label} onChange={(e) => boxUpdate(i, "label", e.target.value)}
                    placeholder="Etiqueta" className="h-7 text-xs bg-background w-28 shrink-0" />
                  <Input value={box.value} onChange={(e) => boxUpdate(i, "value", e.target.value)}
                    placeholder="Valor" className="h-7 text-xs bg-background flex-1" />
                  <button type="button" onClick={() => boxRemove(i)}
                    className="text-muted-foreground hover:text-destructive transition-colors">
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={boxAdd}
                className="text-[11px] text-[#0070F3] hover:underline flex items-center gap-0.5">
                <Plus className="size-3" /> Agregar caja
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className={LABEL}>Etiqueta total</label>
                <Input value={form.totalLabel} onChange={(e) => set("totalLabel", e.target.value)} className="h-8 text-xs bg-background" />
              </div>
              <div className="space-y-1">
                <label className={LABEL}>Valor total</label>
                <Input value={form.totalValue} onChange={(e) => set("totalValue", e.target.value)} placeholder="USD 550" className="h-8 text-xs bg-background" />
              </div>
            </div>
          </Section>

          {/* Preguntas frecuentes */}
          <Section label="Preguntas frecuentes">
            <div className="space-y-3">
              {form.faqItems.map((item, i) => (
                <div key={i} className="border border-border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Input
                      value={item.question}
                      onChange={(e) => faqUpdate(i, "question", e.target.value)}
                      placeholder="Pregunta..."
                      className="h-7 text-xs bg-background flex-1"
                    />
                    <div className="flex gap-0.5 shrink-0">
                      <button type="button" onClick={() => faqMove(i, -1)} disabled={i === 0}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                        <ChevronUp className="size-3.5" />
                      </button>
                      <button type="button" onClick={() => faqMove(i, 1)} disabled={i === form.faqItems.length - 1}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                        <ChevronDown className="size-3.5" />
                      </button>
                      <button type="button" onClick={() => faqRemove(i)}
                        className="text-muted-foreground hover:text-destructive transition-colors ml-0.5">
                        <X className="size-3.5" />
                      </button>
                    </div>
                  </div>
                  <Textarea
                    value={item.answer}
                    onChange={(e) => faqUpdate(i, "answer", e.target.value)}
                    placeholder={"Respuesta...\n(líneas con • se renderizan como lista)"}
                    rows={3}
                    className="text-xs bg-background resize-none"
                  />
                </div>
              ))}
              <button type="button" onClick={faqAdd}
                className="text-[11px] text-[#0070F3] hover:underline flex items-center gap-0.5">
                <Plus className="size-3" /> Agregar pregunta
              </button>
            </div>
          </Section>

          {/* Portfolio toggle */}
          <div className="border-t border-border pt-4 mt-1 flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Franja de portfolio</span>
            <button
              type="button"
              onClick={() => set("showPortfolio", !form.showPortfolio)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.showPortfolio ? "bg-[#0070F3]" : "bg-muted"}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${form.showPortfolio ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
          </div>

          {/* Garantía */}
          <Section label="Garantía de resultados" defaultOpen={false}>
            <p className="text-[10px] text-muted-foreground">Dejá vacío para ocultar esta sección del PDF.</p>
            <Textarea value={form.guaranteeText} onChange={(e) => set("guaranteeText", e.target.value)}
              rows={3} className="text-xs bg-background resize-none" />
          </Section>

          {/* Contacto */}
          <Section label="Contacto (pie de página)" defaultOpen={false}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">WhatsApp / Tel</label>
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} className="h-8 text-xs bg-background" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">Sitio web</label>
                <Input value={form.website} onChange={(e) => set("website", e.target.value)} className="h-8 text-xs bg-background" />
              </div>
            </div>
          </Section>

        </div>
      </div>

      {/* ── Preview panel ────────────────────────────────── */}
      <div className="flex-1 overflow-auto bg-zinc-100 dark:bg-zinc-900 p-8">
        <p className="text-xs text-muted-foreground mb-4">Vista previa — el PDF se verá así</p>
        <div style={{ transform: "scale(0.78)", transformOrigin: "top left", width: "210mm", marginBottom: `${-(1200 * 0.22)}px` }}>
          <div ref={templateRef}>
            <QuoteTemplate data={form} />
          </div>
        </div>
      </div>
    </div>
  );
}

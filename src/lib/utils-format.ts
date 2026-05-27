export function formatCurrency(amount: number, currency = "USD"): string {
  const symbols: Record<string, string> = { USD: "$", ARS: "$", EUR: "€", BTC: "₿" };
  const sym = symbols[currency] ?? currency;
  return `${sym}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateShort(date: string | Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function toInputDate(date: string | Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
}

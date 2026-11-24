import { sortInvoices } from "./invoiceList";
import { stockStatus } from "./stock";
import type { Invoice, Product } from "./types";

export interface MonthBucket {
  /** "AAAA-MM" en hora local. */
  key: string;
  /** Mes abreviado en español ("nov"). */
  label: string;
  /** Mes y año completos ("noviembre de 2026"), para tooltips y tablas. */
  longLabel: string;
  totalCents: number;
}

export interface MonthComparison {
  currentCents: number;
  previousCents: number;
  /** Variación en % frente al mes anterior; `null` si el mes anterior fue 0. */
  changePct: number | null;
}

const shortMonth = new Intl.DateTimeFormat("es-ES", { month: "short" });
const longMonth = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" });

/** Clave del mes en hora local, para no descuadrarse en los bordes de mes. */
export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Los últimos `count` meses hasta el de `now` incluido, del más antiguo al más reciente, a 0. */
export function lastMonths(now: Date, count: number): MonthBucket[] {
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
    return {
      key: monthKey(date),
      label: shortMonth.format(date).replace(".", ""),
      longLabel: longMonth.format(date),
      totalCents: 0,
    };
  });
}

/** Facturado por mes (sin anuladas) en los últimos `count` meses. */
export function monthlyInvoiced(invoices: readonly Invoice[], now: Date, count = 6): MonthBucket[] {
  const months = lastMonths(now, count);
  const byKey = new Map(months.map((month) => [month.key, month]));
  for (const invoice of invoices) {
    if (invoice.status === "void") continue;
    const bucket = byKey.get(monthKey(invoice.issuedAt));
    if (bucket) bucket.totalCents += invoice.totalCents;
  }
  return months;
}

/** Facturado este mes frente al anterior (sin anuladas). */
export function compareWithPreviousMonth(invoices: readonly Invoice[], now: Date): MonthComparison {
  const [previous, current] = monthlyInvoiced(invoices, now, 2);
  const changePct =
    previous.totalCents === 0 ? null : ((current.totalCents - previous.totalCents) / previous.totalCents) * 100;
  return { currentCents: current.totalCents, previousCents: previous.totalCents, changePct };
}

/** "+12 %", "−8 %" o "0 %" (redondeado a entero). */
export function formatChange(pct: number): string {
  const rounded = Math.round(pct);
  if (rounded === 0) return "0 %";
  return `${rounded > 0 ? "+" : "−"}${Math.abs(rounded).toLocaleString("es-ES")} %`;
}

/** Las `count` facturas más recientes. */
export function latestInvoices(invoices: readonly Invoice[], count = 5): Invoice[] {
  return sortInvoices(invoices).slice(0, count);
}

/** Productos agotados o con stock bajo: primero los agotados, luego los de menos stock. */
export function lowStockProducts(products: readonly Product[]): Product[] {
  return products
    .filter((product) => stockStatus(product.stock, product.minStock) !== "ok")
    .sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name, "es"));
}

/** Saludo según la hora local. */
export function greeting(now: Date): string {
  const hour = now.getHours();
  if (hour >= 6 && hour < 14) return "Buenos días";
  if (hour >= 14 && hour < 21) return "Buenas tardes";
  return "Buenas noches";
}

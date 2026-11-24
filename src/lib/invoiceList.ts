import { matchesQuery } from "./search";
import type { Invoice, InvoiceStatus } from "./types";

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  pending: "Pendiente",
  paid: "Pagada",
  void: "Anulada",
};

export type StatusFilter = InvoiceStatus | "all";

export interface InvoiceSummary {
  /** Facturado: pendientes + pagadas (las anuladas no cuentan). */
  invoicedCents: number;
  pendingCents: number;
  paidCents: number;
}

/** Más recientes primero; a igual fecha, el número más alto primero. */
export function sortInvoices(invoices: readonly Invoice[]): Invoice[] {
  return [...invoices].sort(
    (a, b) => b.issuedAt.getTime() - a.issuedAt.getTime() || b.year - a.year || b.seq - a.seq,
  );
}

export function countByStatus(invoices: readonly Invoice[]): Record<StatusFilter, number> {
  const counts: Record<StatusFilter, number> = { all: invoices.length, pending: 0, paid: 0, void: 0 };
  for (const invoice of invoices) counts[invoice.status] += 1;
  return counts;
}

/** Filtra por estado y busca por número, cliente o NIF. */
export function filterInvoices(invoices: readonly Invoice[], status: StatusFilter, query: string): Invoice[] {
  return invoices.filter(
    (invoice) =>
      (status === "all" || invoice.status === status) &&
      matchesQuery([invoice.number, invoice.customerName, invoice.customerTaxId], query),
  );
}

export function summarizeInvoices(invoices: readonly Invoice[]): InvoiceSummary {
  const summary: InvoiceSummary = { invoicedCents: 0, pendingCents: 0, paidCents: 0 };
  for (const invoice of invoices) {
    if (invoice.status === "void") continue;
    summary.invoicedCents += invoice.totalCents;
    if (invoice.status === "pending") summary.pendingCents += invoice.totalCents;
    else summary.paidCents += invoice.totalCents;
  }
  return summary;
}

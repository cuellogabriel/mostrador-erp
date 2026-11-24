import { describe, expect, it } from "vitest";
import {
  countByStatus,
  filterInvoices,
  INVOICE_STATUS_LABEL,
  sortInvoices,
  summarizeInvoices,
} from "@/lib/invoiceList";
import type { Invoice } from "@/lib/types";

const invoice = (overrides: Partial<Invoice>): Invoice => ({
  id: "F-2026-0001",
  number: "F-2026-0001",
  year: 2026,
  seq: 1,
  customerId: "c1",
  customerName: "Ferretería López",
  customerTaxId: "B12345674",
  lines: [],
  baseCents: 1000,
  vatCents: 210,
  totalCents: 1210,
  vatBreakdown: [],
  status: "pending",
  issuedAt: new Date(2026, 0, 10),
  ...overrides,
});

const a = invoice({ id: "a", number: "F-2026-0001", seq: 1, status: "pending", totalCents: 1210 });
const b = invoice({
  id: "b",
  number: "F-2026-0002",
  seq: 2,
  status: "paid",
  totalCents: 500,
  customerName: "Bar Manolo",
  customerTaxId: undefined,
  issuedAt: new Date(2026, 1, 1),
});
const c = invoice({ id: "c", number: "F-2026-0003", seq: 3, status: "void", totalCents: 9999, issuedAt: new Date(2026, 1, 1) });

describe("INVOICE_STATUS_LABEL", () => {
  it("tiene los estados en español", () => {
    expect(INVOICE_STATUS_LABEL).toEqual({ pending: "Pendiente", paid: "Pagada", void: "Anulada" });
  });
});

describe("sortInvoices", () => {
  it("ordena de más reciente a más antigua y, a igual fecha, por número", () => {
    expect(sortInvoices([a, b, c]).map((i) => i.id)).toEqual(["c", "b", "a"]);
  });

  it("no modifica la lista original y acepta listas vacías", () => {
    const list = [a, b];
    sortInvoices(list);
    expect(list).toEqual([a, b]);
    expect(sortInvoices([])).toEqual([]);
  });
});

describe("countByStatus", () => {
  it("cuenta todas y por estado", () => {
    expect(countByStatus([a, b, c])).toEqual({ all: 3, pending: 1, paid: 1, void: 1 });
    expect(countByStatus([])).toEqual({ all: 0, pending: 0, paid: 0, void: 0 });
  });
});

describe("filterInvoices", () => {
  it("filtra por estado", () => {
    expect(filterInvoices([a, b, c], "paid", "")).toEqual([b]);
    expect(filterInvoices([a, b, c], "all", "")).toHaveLength(3);
  });

  it("busca por número, cliente o NIF", () => {
    expect(filterInvoices([a, b, c], "all", "0002")).toEqual([b]);
    expect(filterInvoices([a, b, c], "all", "manolo")).toEqual([b]);
    expect(filterInvoices([a, b, c], "pending", "B-12345674")).toEqual([a]);
    expect(filterInvoices([a, b, c], "all", "nadie")).toEqual([]);
  });
});

describe("summarizeInvoices", () => {
  it("no cuenta las anuladas y separa pendiente y cobrado", () => {
    expect(summarizeInvoices([a, b, c])).toEqual({ invoicedCents: 1710, pendingCents: 1210, paidCents: 500 });
  });

  it("es todo cero sin facturas o solo con anuladas", () => {
    const zero = { invoicedCents: 0, pendingCents: 0, paidCents: 0 };
    expect(summarizeInvoices([])).toEqual(zero);
    expect(summarizeInvoices([c])).toEqual(zero);
  });
});

import { describe, expect, it } from "vitest";
import {
  compareWithPreviousMonth,
  formatChange,
  greeting,
  lastMonths,
  latestInvoices,
  lowStockProducts,
  monthKey,
  monthlyInvoiced,
} from "@/lib/dashboard";
import type { Invoice, InvoiceStatus, Product } from "@/lib/types";

let seq = 0;
const invoice = (issuedAt: Date, totalCents: number, status: InvoiceStatus = "pending"): Invoice => {
  seq += 1;
  return {
    id: `F-2026-${seq}`,
    number: `F-2026-${seq}`,
    year: 2026,
    seq,
    customerId: "c",
    customerName: "C",
    lines: [],
    baseCents: totalCents,
    vatCents: 0,
    totalCents,
    vatBreakdown: [],
    status,
    issuedAt,
  };
};

const product = (name: string, stock: number, minStock: number): Product => ({
  id: name,
  name,
  priceCents: 100,
  vatRate: 21,
  stock,
  minStock,
  createdAt: new Date(2026, 0, 1),
});

describe("monthKey", () => {
  it("usa el mes local con dos cifras", () => {
    expect(monthKey(new Date(2026, 0, 5))).toBe("2026-01");
    expect(monthKey(new Date(2026, 10, 30, 23, 59))).toBe("2026-11");
  });

  it("no se descuadra en el borde de mes (último segundo y primer instante)", () => {
    expect(monthKey(new Date(2026, 9, 31, 23, 59, 59, 999))).toBe("2026-10");
    expect(monthKey(new Date(2026, 10, 1, 0, 0, 0, 0))).toBe("2026-11");
  });
});

describe("lastMonths", () => {
  it("devuelve los 6 últimos meses del más antiguo al actual, a 0", () => {
    const months = lastMonths(new Date(2026, 10, 24), 6);
    expect(months.map((m) => m.key)).toEqual(["2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"]);
    expect(months.map((m) => m.label)).toEqual(["jun", "jul", "ago", "sept", "oct", "nov"]);
    expect(months[5].longLabel).toBe("noviembre de 2026");
    expect(months.every((m) => m.totalCents === 0)).toBe(true);
  });

  it("cruza el cambio de año", () => {
    expect(lastMonths(new Date(2027, 1, 10), 4).map((m) => m.key)).toEqual(["2026-11", "2026-12", "2027-01", "2027-02"]);
  });

  it("funciona el día 31 (no salta meses cortos)", () => {
    expect(lastMonths(new Date(2026, 2, 31), 2).map((m) => m.key)).toEqual(["2026-02", "2026-03"]);
  });

  it("devuelve una lista vacía con 0 meses", () => {
    expect(lastMonths(new Date(2026, 0, 1), 0)).toEqual([]);
  });
});

describe("monthlyInvoiced", () => {
  const now = new Date(2026, 10, 24);

  it("suma por mes, sin anuladas y sin facturas fuera del rango", () => {
    const months = monthlyInvoiced(
      [
        invoice(new Date(2026, 10, 1, 0, 0), 1000),
        invoice(new Date(2026, 10, 20), 500, "paid"),
        invoice(new Date(2026, 10, 21), 9999, "void"),
        invoice(new Date(2026, 9, 31, 23, 59), 300),
        invoice(new Date(2026, 5, 1), 200),
        invoice(new Date(2026, 4, 31, 23, 59), 7777),
      ],
      now,
    );
    expect(months.map((m) => m.totalCents)).toEqual([200, 0, 0, 0, 300, 1500]);
  });

  it("es todo cero sin facturas", () => {
    expect(monthlyInvoiced([], now).every((m) => m.totalCents === 0)).toBe(true);
  });
});

describe("compareWithPreviousMonth", () => {
  const now = new Date(2026, 10, 24);

  it("calcula la variación frente al mes anterior", () => {
    const result = compareWithPreviousMonth(
      [invoice(new Date(2026, 10, 2), 1500), invoice(new Date(2026, 9, 2), 1000)],
      now,
    );
    expect(result).toEqual({ currentCents: 1500, previousCents: 1000, changePct: 50 });
  });

  it("devuelve una bajada como negativo", () => {
    expect(compareWithPreviousMonth([invoice(new Date(2026, 9, 2), 1000)], now).changePct).toBe(-100);
  });

  it("no calcula variación si el mes anterior fue 0", () => {
    expect(compareWithPreviousMonth([invoice(new Date(2026, 10, 2), 1000)], now).changePct).toBeNull();
    expect(compareWithPreviousMonth([], now)).toEqual({ currentCents: 0, previousCents: 0, changePct: null });
  });
});

describe("formatChange", () => {
  it("pone el signo y redondea", () => {
    expect(formatChange(12.4)).toBe("+12 %");
    expect(formatChange(-8.6)).toBe("−9 %");
    expect(formatChange(0.3)).toBe("0 %");
    expect(formatChange(1250)).toBe("+1250 %");
  });
});

describe("latestInvoices", () => {
  it("devuelve las más recientes primero y como mucho `count`", () => {
    const list = [1, 2, 3, 4, 5, 6, 7].map((day) => invoice(new Date(2026, 10, day), day));
    expect(latestInvoices(list).map((i) => i.totalCents)).toEqual([7, 6, 5, 4, 3]);
    expect(latestInvoices(list, 2)).toHaveLength(2);
    expect(latestInvoices([])).toEqual([]);
  });
});

describe("lowStockProducts", () => {
  it("incluye agotados y bajo mínimo, primero los de menos stock", () => {
    const result = lowStockProducts([
      product("Bien", 10, 2),
      product("Bajo", 2, 2),
      product("Agotado", 0, 0),
      product("Casi", 1, 5),
    ]);
    expect(result.map((p) => p.name)).toEqual(["Agotado", "Casi", "Bajo"]);
  });

  it("devuelve una lista vacía si todo va bien", () => {
    expect(lowStockProducts([product("Bien", 10, 2)])).toEqual([]);
  });
});

describe("greeting", () => {
  it("saluda según la hora", () => {
    expect(greeting(new Date(2026, 0, 1, 6))).toBe("Buenos días");
    expect(greeting(new Date(2026, 0, 1, 13, 59))).toBe("Buenos días");
    expect(greeting(new Date(2026, 0, 1, 14))).toBe("Buenas tardes");
    expect(greeting(new Date(2026, 0, 1, 21))).toBe("Buenas noches");
    expect(greeting(new Date(2026, 0, 1, 2))).toBe("Buenas noches");
  });
});

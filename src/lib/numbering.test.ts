import { describe, expect, it } from "vitest";
import { counterKey, formatInvoiceNumber, invoiceYear } from "@/lib/numbering";

describe("formatInvoiceNumber", () => {
  it("rellena el correlativo con ceros a 4 cifras", () => {
    expect(formatInvoiceNumber(2026, 7)).toBe("F-2026-0007");
    expect(formatInvoiceNumber(2026, 1)).toBe("F-2026-0001");
    expect(formatInvoiceNumber(2027, 9999)).toBe("F-2027-9999");
  });

  it("no recorta correlativos de más de 4 cifras", () => {
    expect(formatInvoiceNumber(2026, 10000)).toBe("F-2026-10000");
  });

  it.each([0, -1, 1.5, Number.NaN])("rechaza el correlativo %s", (seq) => {
    expect(() => formatInvoiceNumber(2026, seq)).toThrow(RangeError);
  });

  it.each([26, 10000, 2026.5, -2026])("rechaza el año %s", (year) => {
    expect(() => formatInvoiceNumber(year, 1)).toThrow(RangeError);
  });
});

describe("invoiceYear", () => {
  it("usa el año UTC, no el local", () => {
    expect(invoiceYear(new Date("2026-12-31T23:30:00Z"))).toBe(2026);
    // 00:30 del 1 de enero en Madrid (UTC+1) todavía es 2026 en UTC.
    expect(invoiceYear(new Date("2027-01-01T00:30:00+01:00"))).toBe(2026);
    expect(invoiceYear(new Date("2027-01-01T00:00:00Z"))).toBe(2027);
  });
});

describe("counterKey", () => {
  it("forma la clave del contador del año", () => {
    expect(counterKey(2026)).toBe("invoices_2026");
  });
});

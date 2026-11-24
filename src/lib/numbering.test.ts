import { describe, expect, it } from "vitest";
import { formatInvoiceNumber } from "@/lib/numbering";

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

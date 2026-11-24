import { describe, expect, it } from "vitest";
import { calcInvoice, calcLine, type LineInput } from "@/lib/invoice";
import type { VatRate } from "@/lib/types";

const line = (overrides: Partial<LineInput> = {}): LineInput => ({
  quantity: 1,
  unitPriceCents: 1000,
  vatRate: 21,
  discountPct: 0,
  ...overrides,
});

describe("calcLine", () => {
  it("calcula base, IVA al 21 % y total", () => {
    expect(calcLine(line({ quantity: 3, unitPriceCents: 1999 }))).toEqual({
      baseCents: 5997,
      vatCents: 1259,
      totalCents: 7256,
    });
  });

  it("aplica IVA al 10 %, 4 % y 0 %", () => {
    expect(calcLine(line({ vatRate: 10 }))).toEqual({ baseCents: 1000, vatCents: 100, totalCents: 1100 });
    expect(calcLine(line({ vatRate: 4 }))).toEqual({ baseCents: 1000, vatCents: 40, totalCents: 1040 });
    expect(calcLine(line({ vatRate: 0 }))).toEqual({ baseCents: 1000, vatCents: 0, totalCents: 1000 });
  });

  it("aplica el descuento antes del IVA", () => {
    expect(calcLine(line({ quantity: 2, discountPct: 10, vatRate: 10 }))).toEqual({
      baseCents: 1800,
      vatCents: 180,
      totalCents: 1980,
    });
  });

  it("acepta descuentos con decimales y redondea al céntimo", () => {
    // 333 × 0,875 = 291,375 → 291; 291 × 4 % = 11,64 → 12
    expect(calcLine(line({ unitPriceCents: 333, discountPct: 12.5, vatRate: 4 }))).toEqual({
      baseCents: 291,
      vatCents: 12,
      totalCents: 303,
    });
  });

  it("redondea medio céntimo hacia arriba", () => {
    // 50 × 21 % = 10,5 → 11
    expect(calcLine(line({ unitPriceCents: 50 })).vatCents).toBe(11);
    // 150 × 0,99 = 148,5 → 149
    expect(calcLine(line({ unitPriceCents: 150, discountPct: 1, vatRate: 0 })).baseCents).toBe(149);
  });

  it("devuelve cero con cantidad 0, precio 0 o descuento del 100 %", () => {
    const zero = { baseCents: 0, vatCents: 0, totalCents: 0 };
    expect(calcLine(line({ quantity: 0 }))).toEqual(zero);
    expect(calcLine(line({ unitPriceCents: 0 }))).toEqual(zero);
    expect(calcLine(line({ discountPct: 100 }))).toEqual(zero);
  });

  it("rechaza cantidades negativas o con decimales", () => {
    expect(() => calcLine(line({ quantity: -1 }))).toThrow(RangeError);
    expect(() => calcLine(line({ quantity: 1.5 }))).toThrow(RangeError);
  });

  it("rechaza precios negativos o que no son céntimos enteros", () => {
    expect(() => calcLine(line({ unitPriceCents: -100 }))).toThrow(RangeError);
    expect(() => calcLine(line({ unitPriceCents: 10.5 }))).toThrow(RangeError);
  });

  it("rechaza descuentos fuera de 0–100 o con más de 2 decimales", () => {
    expect(() => calcLine(line({ discountPct: -1 }))).toThrow(RangeError);
    expect(() => calcLine(line({ discountPct: 101 }))).toThrow(RangeError);
    expect(() => calcLine(line({ discountPct: 12.345 }))).toThrow(RangeError);
    expect(() => calcLine(line({ discountPct: Number.NaN }))).toThrow(RangeError);
  });

  it("rechaza tipos de IVA que no existen", () => {
    const rate: number = 7;
    expect(() => calcLine(line({ vatRate: rate as VatRate }))).toThrow(RangeError);
  });
});

describe("calcInvoice", () => {
  it("devuelve ceros y sin desglose si no hay líneas", () => {
    expect(calcInvoice([])).toEqual({ baseCents: 0, vatCents: 0, totalCents: 0, vatBreakdown: [] });
  });

  it("suma líneas con los cuatro tipos de IVA y desglosa por tipo", () => {
    const totals = calcInvoice([
      line({ quantity: 2, unitPriceCents: 1000, vatRate: 21 }), // 2000 + 420
      line({ unitPriceCents: 1550, vatRate: 10, discountPct: 10 }), // 1395 + 139,5 → 140
      line({ quantity: 3, unitPriceCents: 125, vatRate: 4 }), // 375 + 15
      line({ unitPriceCents: 900, vatRate: 0 }), // 900 + 0
      line({ unitPriceCents: 50, vatRate: 21 }), // 50 + 10,5 → 11
    ]);

    expect(totals).toEqual({
      baseCents: 4720,
      vatCents: 586,
      totalCents: 5306,
      vatBreakdown: [
        { rate: 21, baseCents: 2050, vatCents: 431 },
        { rate: 10, baseCents: 1395, vatCents: 140 },
        { rate: 4, baseCents: 375, vatCents: 15 },
        { rate: 0, baseCents: 900, vatCents: 0 },
      ],
    });
  });

  it("redondea por línea, no sobre la suma", () => {
    // Cada línea: 50 × 21 % = 10,5 → 11. Sobre la suma serían 21.
    const totals = calcInvoice([line({ unitPriceCents: 50 }), line({ unitPriceCents: 50 })]);
    expect(totals.vatCents).toBe(22);
    expect(totals.totalCents).toBe(122);
  });

  it("solo incluye en el desglose los tipos presentes", () => {
    const totals = calcInvoice([line({ vatRate: 4 }), line({ vatRate: 4, quantity: 2 })]);
    expect(totals.vatBreakdown).toEqual([{ rate: 4, baseCents: 3000, vatCents: 120 }]);
  });

  it("propaga el error de una línea no válida", () => {
    expect(() => calcInvoice([line(), line({ quantity: -2 })])).toThrow(RangeError);
  });
});

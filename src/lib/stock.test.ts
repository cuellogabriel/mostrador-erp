import { describe, expect, it } from "vitest";
import { applyStockDelta, InsufficientStockError, needsRestock, stockStatus } from "@/lib/stock";

describe("stockStatus", () => {
  it("marca agotado con 0 unidades, aunque el mínimo sea 0", () => {
    expect(stockStatus(0, 0)).toBe("out");
    expect(stockStatus(0, 5)).toBe("out");
  });

  it("marca stock bajo cuando está en el mínimo o por debajo", () => {
    expect(stockStatus(5, 5)).toBe("low");
    expect(stockStatus(1, 5)).toBe("low");
  });

  it("marca ok por encima del mínimo", () => {
    expect(stockStatus(6, 5)).toBe("ok");
    expect(stockStatus(1, 0)).toBe("ok");
  });

  it("trata un stock negativo (dato corrupto) como agotado", () => {
    expect(stockStatus(-3, 0)).toBe("out");
  });
});

describe("needsRestock", () => {
  it("incluye agotados y stock bajo, no los que van bien", () => {
    expect(needsRestock({ stock: 0, minStock: 0 })).toBe(true);
    expect(needsRestock({ stock: 2, minStock: 2 })).toBe(true);
    expect(needsRestock({ stock: 3, minStock: 2 })).toBe(false);
  });
});

describe("applyStockDelta", () => {
  it("suma y resta unidades", () => {
    expect(applyStockDelta(5, 1)).toBe(6);
    expect(applyStockDelta(5, -2)).toBe(3);
    expect(applyStockDelta(5, 0)).toBe(5);
  });

  it("permite llegar justo a 0", () => {
    expect(applyStockDelta(1, -1)).toBe(0);
  });

  it("no deja bajar de 0 e informa de lo disponible", () => {
    expect(() => applyStockDelta(0, -1)).toThrow(InsufficientStockError);
    try {
      applyStockDelta(2, -5);
    } catch (error) {
      expect(error).toBeInstanceOf(InsufficientStockError);
      expect(error instanceof InsufficientStockError && error.available).toBe(2);
    }
  });

  it("rechaza stocks o cantidades no enteras o stock negativo", () => {
    expect(() => applyStockDelta(1.5, 1)).toThrow(RangeError);
    expect(() => applyStockDelta(-1, 1)).toThrow(RangeError);
    expect(() => applyStockDelta(1, 0.5)).toThrow(RangeError);
    expect(() => applyStockDelta(1, Number.NaN)).toThrow(RangeError);
  });
});

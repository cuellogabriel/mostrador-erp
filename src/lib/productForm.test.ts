import { describe, expect, it } from "vitest";
import {
  EMPTY_PRODUCT_FORM,
  MAX_STOCK,
  parseNonNegativeInt,
  parseVatRate,
  productToForm,
  validateProductForm,
  type ProductFormValues,
} from "@/lib/productForm";

const form = (overrides: Partial<ProductFormValues> = {}): ProductFormValues => ({
  ...EMPTY_PRODUCT_FORM,
  name: "Tornillo 4 mm",
  price: "12,50",
  ...overrides,
});

describe("parseNonNegativeInt", () => {
  it("acepta enteros ≥ 0 con espacios alrededor", () => {
    expect(parseNonNegativeInt("0")).toBe(0);
    expect(parseNonNegativeInt(" 42 ")).toBe(42);
    expect(parseNonNegativeInt(String(MAX_STOCK))).toBe(MAX_STOCK);
  });

  it.each(["", "-1", "1.5", "1,5", "abc", "1e3", String(MAX_STOCK + 1)])("rechaza %j", (value) => {
    expect(parseNonNegativeInt(value)).toBeNull();
  });
});

describe("parseVatRate", () => {
  it("acepta los cuatro tipos", () => {
    expect(["21", "10", "4", "0"].map(parseVatRate)).toEqual([21, 10, 4, 0]);
  });

  it("rechaza otros valores", () => {
    expect(parseVatRate("7")).toBeNull();
    expect(parseVatRate("")).toBeNull();
    expect(parseVatRate("21%")).toBeNull();
  });
});

describe("validateProductForm", () => {
  it("convierte el precio en euros a céntimos", () => {
    expect(validateProductForm(form())).toEqual({
      ok: true,
      data: { name: "Tornillo 4 mm", priceCents: 1250, vatRate: 21, stock: 0, minStock: 0 },
    });
  });

  it("guarda el SKU recortado solo si se informa", () => {
    const result = validateProductForm(form({ sku: "  TOR-4  ", vatRate: "10", stock: "12", minStock: "3" }));
    expect(result).toEqual({
      ok: true,
      data: { name: "Tornillo 4 mm", sku: "TOR-4", priceCents: 1250, vatRate: 10, stock: 12, minStock: 3 },
    });
  });

  it("acepta precio 0 (producto gratuito)", () => {
    const result = validateProductForm(form({ price: "0" }));
    expect(result.ok && result.data.priceCents).toBe(0);
  });

  it("exige nombre y precio", () => {
    const result = validateProductForm(form({ name: " ", price: "" }));
    expect(!result.ok && result.errors.name).toMatch(/nombre/);
    expect(!result.ok && result.errors.price).toMatch(/precio sin IVA/);
  });

  it("rechaza precios con más de 2 decimales, texto o negativos", () => {
    expect(validateProductForm(form({ price: "12,505" })).ok).toBe(false);
    expect(validateProductForm(form({ price: "doce" })).ok).toBe(false);
    const negative = validateProductForm(form({ price: "-1" }));
    expect(!negative.ok && negative.errors.price).toBe("El precio no puede ser negativo.");
  });

  it("rechaza tipos de IVA que no existen", () => {
    const result = validateProductForm(form({ vatRate: "7" }));
    expect(!result.ok && result.errors.vatRate).toMatch(/21 %, 10 %, 4 % o 0 %/);
  });

  it("exige stock y mínimo enteros ≥ 0", () => {
    const result = validateProductForm(form({ stock: "-1", minStock: "2.5" }));
    expect(!result.ok && result.errors.stock).toMatch(/entero/);
    expect(!result.ok && result.errors.minStock).toMatch(/entero/);
    expect(validateProductForm(form({ stock: "" })).ok).toBe(false);
  });

  it("limita nombre y SKU", () => {
    const result = validateProductForm(form({ name: "a".repeat(201), sku: "a".repeat(65) }));
    expect(!result.ok && result.errors.name).toMatch(/200/);
    expect(!result.ok && result.errors.sku).toMatch(/64/);
  });
});

describe("productToForm", () => {
  it("muestra el precio en euros con coma y los números como texto", () => {
    expect(
      productToForm({
        id: "p1",
        name: "Cable",
        priceCents: 1205,
        vatRate: 4,
        stock: 7,
        minStock: 2,
        createdAt: new Date(2026, 0, 1),
      }),
    ).toEqual({ name: "Cable", sku: "", price: "12,05", vatRate: "4", stock: "7", minStock: "2" });
  });

  it("ida y vuelta: lo que se edita se vuelve a guardar igual", () => {
    const input = { name: "Cable", sku: "CB-1", priceCents: 99999, vatRate: 0 as const, stock: 0, minStock: 0 };
    const product = { id: "p1", createdAt: new Date(2026, 0, 1), ...input };
    expect(validateProductForm(productToForm(product))).toEqual({ ok: true, data: input });
  });
});

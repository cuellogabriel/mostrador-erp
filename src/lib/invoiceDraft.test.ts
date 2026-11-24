import { describe, expect, it } from "vitest";
import {
  addProductToDraft,
  draftLineInput,
  draftTotals,
  MAX_INVOICE_LINES,
  newDraftLine,
  parseDiscount,
  parseQuantity,
  requestedQuantities,
  validateInvoiceDraft,
  type DraftLine,
} from "@/lib/invoiceDraft";
import type { Product } from "@/lib/types";

const product = (overrides: Partial<Product> = {}): Product => ({
  id: "p1",
  name: "Tornillo",
  priceCents: 1000,
  vatRate: 21,
  stock: 10,
  minStock: 0,
  createdAt: new Date(2026, 0, 1),
  ...overrides,
});

const line = (overrides: Partial<DraftLine> = {}): DraftLine => ({
  key: "l1",
  productId: "p1",
  name: "Tornillo",
  vatRate: 21,
  unitPrice: "10,00",
  quantity: "1",
  discount: "",
  ...overrides,
});

const customer = { id: "c1", name: "Ferretería López", taxId: "B12345674" };

describe("parseQuantity", () => {
  it("acepta enteros desde 1", () => {
    expect(parseQuantity("1")).toBe(1);
    expect(parseQuantity(" 25 ")).toBe(25);
  });

  it.each(["", "0", "-1", "1,5", "1.5", "abc", "99999999999"])("rechaza %j", (value) => {
    expect(parseQuantity(value)).toBeNull();
  });
});

describe("parseDiscount", () => {
  it("vacío es sin descuento", () => {
    expect(parseDiscount("")).toBe(0);
    expect(parseDiscount("  ")).toBe(0);
  });

  it("acepta coma o punto, el símbolo % y hasta 2 decimales", () => {
    expect(parseDiscount("10")).toBe(10);
    expect(parseDiscount("12,5")).toBe(12.5);
    expect(parseDiscount("7.25 %")).toBe(7.25);
    expect(parseDiscount("0")).toBe(0);
    expect(parseDiscount("100")).toBe(100);
  });

  it.each(["-5", "101", "12,345", "abc", "1e2"])("rechaza %j", (value) => {
    expect(parseDiscount(value)).toBeNull();
  });
});

describe("draftLineInput", () => {
  it("convierte los textos en números (precio en céntimos)", () => {
    expect(draftLineInput(line({ unitPrice: "12,50", quantity: "3", discount: "10" }))).toEqual({
      quantity: 3,
      unitPriceCents: 1250,
      vatRate: 21,
      discountPct: 10,
    });
  });

  it("devuelve null si algún campo no es válido o el precio es negativo", () => {
    expect(draftLineInput(line({ quantity: "0" }))).toBeNull();
    expect(draftLineInput(line({ unitPrice: "abc" }))).toBeNull();
    expect(draftLineInput(line({ unitPrice: "-1" }))).toBeNull();
    expect(draftLineInput(line({ discount: "200" }))).toBeNull();
  });
});

describe("newDraftLine y addProductToDraft", () => {
  it("crea la línea con el precio, el IVA y el nombre del producto", () => {
    expect(newDraftLine(product({ priceCents: 1205, vatRate: 10 }), "k")).toEqual({
      key: "k",
      productId: "p1",
      name: "Tornillo",
      vatRate: 10,
      unitPrice: "12,05",
      quantity: "1",
      discount: "",
    });
  });

  it("añade una línea nueva si el producto no está", () => {
    const lines = addProductToDraft([], product(), "a");
    expect(lines).toHaveLength(1);
    expect(addProductToDraft(lines, product({ id: "p2", name: "Cable" }), "b")).toHaveLength(2);
  });

  it("suma 1 a la cantidad si el producto ya está", () => {
    const lines = addProductToDraft([line({ quantity: "2" })], product(), "x");
    expect(lines).toHaveLength(1);
    expect(lines[0].quantity).toBe("3");
  });

  it("si la cantidad escrita no era válida, la deja en 1", () => {
    expect(addProductToDraft([line({ quantity: "" })], product(), "x")[0].quantity).toBe("1");
  });
});

describe("requestedQuantities", () => {
  it("suma las líneas del mismo producto e ignora cantidades no válidas", () => {
    const totals = requestedQuantities([
      line({ key: "a", quantity: "2" }),
      line({ key: "b", quantity: "3" }),
      line({ key: "c", productId: "p2", quantity: "x" }),
    ]);
    expect([...totals]).toEqual([["p1", 5]]);
  });
});

describe("draftTotals", () => {
  it("es cero sin líneas", () => {
    expect(draftTotals([]).totalCents).toBe(0);
  });

  it("calcula con calcInvoice solo las líneas válidas", () => {
    const totals = draftTotals([
      line({ key: "a", unitPrice: "10", quantity: "2" }),
      line({ key: "b", productId: "p2", vatRate: 4, unitPrice: "5", quantity: "1", discount: "10" }),
      line({ key: "c", quantity: "" }),
    ]);
    expect(totals).toEqual({
      baseCents: 2450,
      vatCents: 438,
      totalCents: 2888,
      vatBreakdown: [
        { rate: 21, baseCents: 2000, vatCents: 420 },
        { rate: 4, baseCents: 450, vatCents: 18 },
      ],
    });
  });
});

describe("validateInvoiceDraft", () => {
  it("devuelve cliente, líneas y totales cuando todo es válido", () => {
    const result = validateInvoiceDraft({
      customer,
      lines: [line({ unitPrice: "12,50", quantity: "2", discount: "10" })],
      stock: { p1: 5 },
    });
    expect(result).toEqual({
      ok: true,
      customer,
      lines: [{ productId: "p1", name: "Tornillo", quantity: 2, unitPriceCents: 1250, vatRate: 21, discountPct: 10 }],
      totals: {
        baseCents: 2250,
        vatCents: 473,
        totalCents: 2723,
        vatBreakdown: [{ rate: 21, baseCents: 2250, vatCents: 473 }],
      },
    });
  });

  it("exige cliente y al menos una línea", () => {
    const result = validateInvoiceDraft({ customer: null, lines: [], stock: {} });
    expect(result).toEqual({
      ok: false,
      errors: { customer: "Elige el cliente de la factura.", lines: "Añade al menos un producto.", byLine: {} },
    });
  });

  it("limita el número de líneas", () => {
    const lines = Array.from({ length: MAX_INVOICE_LINES + 1 }, (_, i) => line({ key: `k${i}`, productId: `p${i}` }));
    const stock = Object.fromEntries(lines.map((l) => [l.productId, 10]));
    const result = validateInvoiceDraft({ customer, lines, stock });
    expect(!result.ok && result.errors.lines).toMatch(/200 líneas/);
  });

  it("marca los campos no válidos de cada línea", () => {
    const result = validateInvoiceDraft({
      customer,
      lines: [line({ unitPrice: "-1", quantity: "0", discount: "150" })],
      stock: { p1: 5 },
    });
    expect(!result.ok && result.errors.byLine.l1).toEqual({
      unitPrice: "El precio no puede ser negativo.",
      quantity: "Escribe una cantidad entera mayor que 0.",
      discount: "El descuento va de 0 a 100 %.",
    });
  });

  it("avisa si la cantidad supera el stock, sumando las líneas del mismo producto", () => {
    const result = validateInvoiceDraft({
      customer,
      lines: [line({ key: "a", quantity: "2" }), line({ key: "b", quantity: "2" })],
      stock: { p1: 3 },
    });
    expect(!result.ok && result.errors.byLine).toEqual({
      a: { stock: "Solo quedan 3 unidades." },
      b: { stock: "Solo quedan 3 unidades." },
    });
  });

  it("permite facturar justo el stock disponible", () => {
    expect(validateInvoiceDraft({ customer, lines: [line({ quantity: "3" })], stock: { p1: 3 } }).ok).toBe(true);
  });

  it("distingue agotado, una sola unidad y producto borrado", () => {
    const out = validateInvoiceDraft({ customer, lines: [line()], stock: { p1: 0 } });
    expect(!out.ok && out.errors.byLine.l1.stock).toBe("Producto agotado.");
    const one = validateInvoiceDraft({ customer, lines: [line({ quantity: "2" })], stock: { p1: 1 } });
    expect(!one.ok && one.errors.byLine.l1.stock).toBe("Solo queda 1 unidad.");
    const gone = validateInvoiceDraft({ customer, lines: [line()], stock: {} });
    expect(!gone.ok && gone.errors.byLine.l1.stock).toMatch(/ya no existe/);
  });

  it("acepta precio 0 (regalo) y descuento del 100 %", () => {
    const result = validateInvoiceDraft({
      customer,
      lines: [line({ key: "a", unitPrice: "0" }), line({ key: "b", productId: "p2", discount: "100" })],
      stock: { p1: 1, p2: 1 },
    });
    expect(result.ok && result.totals.totalCents).toBe(0);
  });
});

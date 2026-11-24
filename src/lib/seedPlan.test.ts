import { describe, expect, it } from "vitest";
import { validateBusinessForm } from "@/lib/businessForm";
import { validateCustomerForm, customerToForm } from "@/lib/customerForm";
import { productToForm, validateProductForm } from "@/lib/productForm";
import { buildSeedPlan } from "@/lib/seedPlan";
import { applyStockDelta, stockStatus } from "@/lib/stock";

const now = new Date(2026, 10, 24, 12, 0);
const plan = buildSeedPlan(now);

describe("buildSeedPlan", () => {
  it("tiene emisor, 8 clientes, 12 productos y 18 facturas en noviembre", () => {
    expect(plan.customers).toHaveLength(8);
    expect(plan.products).toHaveLength(12);
    expect(plan.invoices).toHaveLength(18);
  });

  it("todos los datos pasan la misma validación que los formularios", () => {
    expect(validateBusinessForm({ ...plan.business, email: plan.business.email ?? "", phone: plan.business.phone ?? "" }).ok).toBe(true);
    for (const customer of plan.customers) {
      const result = validateCustomerForm(customerToForm({ ...customer, id: "x", createdAt: now }));
      expect(result).toEqual({ ok: true, data: customer });
    }
    for (const product of plan.products) {
      expect(validateProductForm(productToForm({ ...product, id: "x", createdAt: now }))).toEqual({ ok: true, data: product });
    }
  });

  it("usa datos de contacto claramente ficticios", () => {
    const contacts = [plan.business, ...plan.customers];
    for (const contact of contacts) {
      if (contact.email) expect(contact.email).toMatch(/@ejemplo\.es$/);
      if (contact.phone) expect(contact.phone).toMatch(/^600 000 0\d\d$/);
    }
    for (const customer of plan.customers.filter((c) => c.name.endsWith("S.L.") || c.name.endsWith("S.A."))) {
      expect(customer.name).toMatch(/Ejemplo|Demo/);
    }
  });

  it("incluye los cuatro tipos de IVA", () => {
    expect(new Set(plan.products.map((p) => p.vatRate))).toEqual(new Set([21, 10, 4, 0]));
  });

  it("fecha las facturas en orden, en el pasado, en los últimos 6 meses y del mismo año UTC", () => {
    const times = plan.invoices.map((i) => i.issuedAt.getTime());
    expect([...times].sort((a, b) => a - b)).toEqual(times);
    expect(plan.invoices.every((i) => i.issuedAt.getTime() < now.getTime())).toBe(true);
    expect(plan.invoices.every((i) => i.issuedAt.getUTCFullYear() === 2026)).toBe(true);
    expect(new Set(plan.invoices.map((i) => i.issuedAt.getMonth()))).toEqual(new Set([5, 6, 7, 8, 9, 10]));
  });

  it("mezcla pagadas, pendientes y 2 anuladas; las pagadas tienen paidAt pasado y posterior a la emisión", () => {
    const outcomes = plan.invoices.map((i) => i.outcome);
    expect(outcomes.filter((o) => o === "void")).toHaveLength(2);
    expect(outcomes.filter((o) => o === "paid").length).toBeGreaterThan(5);
    expect(outcomes.filter((o) => o === "pending").length).toBeGreaterThan(1);
    for (const invoice of plan.invoices) {
      if (invoice.outcome === "paid") {
        expect(invoice.paidAt && invoice.paidAt > invoice.issuedAt && invoice.paidAt < now).toBe(true);
      } else {
        expect(invoice.paidAt).toBeUndefined();
      }
    }
  });

  it("las líneas apuntan a productos y clientes existentes, con cantidades ≥ 1", () => {
    for (const invoice of plan.invoices) {
      expect(plan.customers[invoice.customerIndex]).toBeDefined();
      for (const line of invoice.lines) {
        expect(plan.products[line.productIndex]).toBeDefined();
        expect(line.quantity).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("el stock nunca baja de 0 al emitir en orden (anulando al momento) y acaba en el stock final", () => {
    const stock = plan.products.map((p) => p.stock);
    for (const invoice of plan.invoices) {
      for (const line of invoice.lines) stock[line.productIndex] = applyStockDelta(stock[line.productIndex], -line.quantity);
      if (invoice.outcome === "void") {
        for (const line of invoice.lines) stock[line.productIndex] += line.quantity;
      }
    }
    expect(stock).toEqual(plan.finalStock);
  });

  it("deja algún producto agotado y alguno con stock bajo", () => {
    const statuses = plan.finalStock.map((stock, i) => stockStatus(stock, plan.products[i].minStock));
    expect(statuses).toContain("out");
    expect(statuses).toContain("low");
  });

  it("en enero solo usa fechas del año en curso y del pasado", () => {
    const january = new Date(2027, 0, 20, 12, 0);
    const result = buildSeedPlan(january);
    expect(result.invoices.length).toBeGreaterThan(0);
    expect(result.invoices.every((i) => i.issuedAt.getUTCFullYear() === 2027 && i.issuedAt < january)).toBe(true);
  });

  it("el día 1 a primera hora no fecha nada en el futuro", () => {
    const early = new Date(2026, 10, 1, 0, 30);
    expect(buildSeedPlan(early).invoices.every((i) => i.issuedAt < early)).toBe(true);
  });
});

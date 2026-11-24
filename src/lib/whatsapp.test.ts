import { describe, expect, it } from "vitest";
import type { Invoice } from "@/lib/types";
import { invoiceShareText, whatsAppShareUrl } from "@/lib/whatsapp";

const invoice: Invoice = {
  id: "F-2026-0007",
  number: "F-2026-0007",
  year: 2026,
  seq: 7,
  customerId: "c1",
  customerName: "Ferretería López",
  lines: [
    { productId: "p1", name: "Tornillo", quantity: 2, unitPriceCents: 1000, vatRate: 21, discountPct: 0 },
    { productId: "p2", name: "Libro", quantity: 1, unitPriceCents: 2000, vatRate: 4, discountPct: 12.5 },
  ],
  baseCents: 3750,
  vatCents: 490,
  totalCents: 4240,
  vatBreakdown: [
    { rate: 21, baseCents: 2000, vatCents: 420 },
    { rate: 4, baseCents: 1750, vatCents: 70 },
  ],
  status: "pending",
  issuedAt: new Date(2026, 2, 5),
};

describe("invoiceShareText", () => {
  it("resume número, fecha, líneas, IVA y total sin espacios duros", () => {
    expect(invoiceShareText(invoice)).toBe(
      [
        "Hola, Ferretería López:",
        "Te envío el resumen de la factura F-2026-0007 del 05/03/2026.",
        "",
        "• 2 × Tornillo: 20,00 €",
        "• 1 × Libro (-12,5 %): 17,50 €",
        "",
        "Base imponible: 37,50 €",
        "IVA 21 %: 4,20 €",
        "IVA 4 %: 0,70 €",
        "*Total: 42,40 €*",
        "",
        "Pendiente de pago.",
        "¡Gracias!",
      ].join("\n"),
    );
  });

  it("indica la fecha de pago si está pagada", () => {
    const text = invoiceShareText({ ...invoice, status: "paid", paidAt: new Date(2026, 2, 20) });
    expect(text).toContain("Pagada el 20/03/2026.");
  });

  it("indica si está anulada", () => {
    expect(invoiceShareText({ ...invoice, status: "void" })).toContain("\nAnulada.\n");
  });

  it("funciona con una factura sin líneas ni IVA", () => {
    const text = invoiceShareText({ ...invoice, lines: [], vatBreakdown: [], baseCents: 0, vatCents: 0, totalCents: 0 });
    expect(text).toContain("*Total: 0,00 €*");
  });
});

describe("whatsAppShareUrl", () => {
  it("codifica el texto en la URL de wa.me", () => {
    expect(whatsAppShareUrl("Hola & adiós\n€")).toBe("https://wa.me/?text=Hola%20%26%20adi%C3%B3s%0A%E2%82%AC");
  });

  it("acepta un texto vacío", () => {
    expect(whatsAppShareUrl("")).toBe("https://wa.me/?text=");
  });
});

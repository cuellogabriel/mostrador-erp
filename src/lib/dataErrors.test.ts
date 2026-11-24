import { describe, expect, it } from "vitest";
import { dataErrorMessage, MissingCustomerError } from "@/lib/dataErrors";
import { InsufficientStockError, MissingProductError } from "@/lib/stock";

const FALLBACK = "Algo ha fallado al guardar o cargar los datos. Inténtalo de nuevo.";

describe("dataErrorMessage", () => {
  it("explica la falta de stock con lo que queda", () => {
    expect(dataErrorMessage(new InsufficientStockError(3))).toBe("No hay stock suficiente: quedan 3 unidades.");
    expect(dataErrorMessage(new InsufficientStockError(1))).toBe("No hay stock suficiente: queda 1 unidad.");
    expect(dataErrorMessage(new InsufficientStockError(0))).toBe("No hay stock suficiente: quedan 0 unidades.");
  });

  it("nombra el producto sin stock o borrado", () => {
    expect(dataErrorMessage(new InsufficientStockError(2, "Tornillo"))).toBe(
      "No hay stock suficiente de «Tornillo»: quedan 2 unidades.",
    );
    expect(dataErrorMessage(new MissingProductError("Cable"))).toBe(
      "El producto «Cable» ya no existe. Quítalo de la factura.",
    );
  });

  it("avisa si el cliente se ha borrado", () => {
    expect(dataErrorMessage(new MissingCustomerError())).toMatch(/cliente ya no existe/);
  });

  it("traduce los códigos de Firestore más habituales", () => {
    expect(dataErrorMessage({ code: "permission-denied" })).toMatch(/permiso/);
    expect(dataErrorMessage({ code: "unavailable" })).toMatch(/conexión/);
    expect(dataErrorMessage({ code: "not-found" })).toMatch(/ya no existe/);
    expect(dataErrorMessage({ code: "aborted" })).toMatch(/a la vez/);
  });

  it("usa un mensaje genérico con códigos desconocidos o valores raros", () => {
    expect(dataErrorMessage({ code: "internal" })).toBe(FALLBACK);
    expect(dataErrorMessage({ code: "constructor" })).toBe(FALLBACK);
    expect(dataErrorMessage({ code: 7 })).toBe(FALLBACK);
    expect(dataErrorMessage(new Error("x"))).toBe(FALLBACK);
    expect(dataErrorMessage(null)).toBe(FALLBACK);
    expect(dataErrorMessage(undefined)).toBe(FALLBACK);
  });
});

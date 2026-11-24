import { describe, expect, it } from "vitest";
import { isActivePath } from "@/lib/navigation";

describe("isActivePath", () => {
  it("marca la ruta exacta", () => {
    expect(isActivePath("/clientes", "/clientes")).toBe(true);
  });

  it("marca las subrutas de la sección", () => {
    expect(isActivePath("/facturas/abc123", "/facturas")).toBe(true);
  });

  it("no confunde rutas que solo comparten prefijo", () => {
    expect(isActivePath("/productos-viejos", "/productos")).toBe(false);
  });

  it("no marca otras secciones ni la raíz", () => {
    expect(isActivePath("/panel", "/clientes")).toBe(false);
    expect(isActivePath("/", "/panel")).toBe(false);
    expect(isActivePath("", "/panel")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { authErrorMessage } from "@/lib/authErrors";

const FALLBACK = "No se ha podido completar la operación. Inténtalo de nuevo.";

describe("authErrorMessage", () => {
  it("traduce credenciales incorrectas sin revelar si el email existe", () => {
    const expected = "El email o la contraseña no son correctos.";
    expect(authErrorMessage({ code: "auth/invalid-credential" })).toBe(expected);
    expect(authErrorMessage({ code: "auth/user-not-found" })).toBe(expected);
    expect(authErrorMessage({ code: "auth/wrong-password" })).toBe(expected);
  });

  it("traduce errores de registro", () => {
    expect(authErrorMessage({ code: "auth/email-already-in-use" })).toMatch(/Ya existe una cuenta/);
    expect(authErrorMessage({ code: "auth/weak-password" })).toMatch(/6 caracteres/);
  });

  it("traduce errores de red y de exceso de intentos", () => {
    expect(authErrorMessage({ code: "auth/network-request-failed" })).toMatch(/conexión/);
    expect(authErrorMessage({ code: "auth/too-many-requests" })).toMatch(/Demasiados intentos/);
  });

  it("usa un mensaje genérico para códigos desconocidos o valores raros", () => {
    expect(authErrorMessage({ code: "auth/otro-error" })).toBe(FALLBACK);
    expect(authErrorMessage({ code: 42 })).toBe(FALLBACK);
    expect(authErrorMessage({ code: "toString" })).toBe(FALLBACK);
    expect(authErrorMessage(new Error("fallo"))).toBe(FALLBACK);
    expect(authErrorMessage("auth/invalid-credential")).toBe(FALLBACK);
    expect(authErrorMessage(null)).toBe(FALLBACK);
    expect(authErrorMessage(undefined)).toBe(FALLBACK);
  });
});

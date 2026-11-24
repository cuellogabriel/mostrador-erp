import { describe, expect, it } from "vitest";
import { hasErrors, isValidEmail, validateLogin, validateRegister } from "@/lib/validation";

describe("isValidEmail", () => {
  it.each(["ana@empresa.es", "demo@mostrador.app", "nombre.apellido+tag@sub.dominio.com", "  ana@empresa.es  "])(
    "acepta %j",
    (value) => {
      expect(isValidEmail(value)).toBe(true);
    },
  );

  it.each(["", "ana", "ana@", "@empresa.es", "ana@empresa", "ana @empresa.es", "ana@@empresa.es", "ana@empresa."])(
    "rechaza %j",
    (value) => {
      expect(isValidEmail(value)).toBe(false);
    },
  );
});

describe("hasErrors", () => {
  it("es falso sin errores o con errores vacíos", () => {
    expect(hasErrors({})).toBe(false);
    expect(hasErrors({ email: undefined })).toBe(false);
  });

  it("es verdadero si algún campo tiene mensaje", () => {
    expect(hasErrors({ email: undefined, password: "Escribe tu contraseña." })).toBe(true);
  });
});

describe("validateLogin", () => {
  it("no devuelve errores con datos correctos", () => {
    expect(validateLogin({ email: "ana@empresa.es", password: "x" })).toEqual({});
  });

  it("exige email y contraseña", () => {
    expect(validateLogin({ email: "  ", password: "" })).toEqual({
      email: "Escribe tu email.",
      password: "Escribe tu contraseña.",
    });
  });

  it("rechaza un email mal formado", () => {
    expect(validateLogin({ email: "ana@", password: "secreta" }).email).toMatch(/email válido/);
  });
});

describe("validateRegister", () => {
  const ok = { email: "ana@empresa.es", password: "123456", confirm: "123456" };

  it("no devuelve errores con datos correctos (6 caracteres justos)", () => {
    expect(validateRegister(ok)).toEqual({});
  });

  it("exige todos los campos", () => {
    expect(validateRegister({ email: "", password: "", confirm: "" })).toEqual({
      email: "Escribe tu email.",
      password: "Elige una contraseña.",
      confirm: "Repite la contraseña.",
    });
  });

  it("rechaza contraseñas de menos de 6 caracteres", () => {
    expect(validateRegister({ ...ok, password: "12345", confirm: "12345" }).password).toMatch(/al menos 6/);
  });

  it("rechaza confirmaciones que no coinciden", () => {
    expect(validateRegister({ ...ok, confirm: "654321" })).toEqual({ confirm: "Las contraseñas no coinciden." });
  });
});

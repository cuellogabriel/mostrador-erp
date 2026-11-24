import { describe, expect, it } from "vitest";
import { validateSpanishTaxId } from "@/lib/taxId";

describe("validateSpanishTaxId", () => {
  it.each([
    ["12345678Z", "NIF"],
    ["00000000T", "NIF"],
    ["X1234567L", "NIE"],
    ["Y1234567X", "NIE"],
    ["Z1234567R", "NIE"],
    ["B12345674", "CIF"],
    ["A58818501", "CIF"],
    ["Q1234567D", "CIF"],
    ["C12345674", "CIF"],
    ["C1234567D", "CIF"],
  ])("acepta %s como %s", (value, type) => {
    expect(validateSpanishTaxId(value)).toEqual({ valid: true, type, normalized: value });
  });

  it("normaliza minúsculas, espacios y guiones", () => {
    expect(validateSpanishTaxId(" 1234 5678-z ")).toEqual({
      valid: true,
      type: "NIF",
      normalized: "12345678Z",
    });
    expect(validateSpanishTaxId("x-1234567-l")).toEqual({ valid: true, type: "NIE", normalized: "X1234567L" });
  });

  it.each([
    ["12345678A", "NIF con letra incorrecta"],
    ["X1234567A", "NIE con letra incorrecta"],
    ["B12345675", "CIF con dígito incorrecto"],
    ["B1234567D", "CIF de sociedad limitada con letra (debe ser dígito)"],
    ["Q12345674", "CIF de organismo con dígito (debe ser letra)"],
    ["I12345674", "CIF con letra inicial no válida"],
    ["1234567Z", "NIF con 7 dígitos"],
    ["123456789Z", "NIF con 9 dígitos"],
    ["W123456", "demasiado corto"],
    ["", "vacío"],
    ["   ", "solo espacios"],
    ["ABCDEFGHI", "solo letras"],
  ])("rechaza %j (%s)", (value) => {
    expect(validateSpanishTaxId(value)).toEqual({ valid: false });
  });
});

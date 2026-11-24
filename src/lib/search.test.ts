import { describe, expect, it } from "vitest";
import { compareText, matchesQuery, normalizeText } from "@/lib/search";

describe("normalizeText", () => {
  it("quita tildes, pasa a minúsculas y recorta espacios", () => {
    expect(normalizeText("  Óscar Núñez ")).toBe("oscar nunez");
  });

  it("deja igual un texto vacío", () => {
    expect(normalizeText("")).toBe("");
  });
});

describe("matchesQuery", () => {
  const fields = ["Ferretería López", "B12345674", "pedidos@lopez.es", undefined];

  it("acepta todo con una búsqueda vacía o de espacios", () => {
    expect(matchesQuery(fields, "")).toBe(true);
    expect(matchesQuery(fields, "   ")).toBe(true);
  });

  it("busca sin distinguir tildes ni mayúsculas", () => {
    expect(matchesQuery(fields, "ferreteria")).toBe(true);
    expect(matchesQuery(fields, "LÓPEZ")).toBe(true);
  });

  it("busca en cualquiera de los campos", () => {
    expect(matchesQuery(fields, "b1234")).toBe(true);
    expect(matchesQuery(fields, "pedidos@")).toBe(true);
  });

  it("encuentra un NIF escrito con guiones, puntos o espacios", () => {
    expect(matchesQuery(fields, "B-12345674")).toBe(true);
    expect(matchesQuery(fields, "b.1234.5674")).toBe(true);
    expect(matchesQuery(["12345678Z"], "12.345.678-z")).toBe(true);
    expect(matchesQuery(fields, "B-99")).toBe(false);
  });

  it("exige que aparezcan todas las palabras", () => {
    expect(matchesQuery(fields, "lopez pedidos")).toBe(true);
    expect(matchesQuery(fields, "lopez garcía")).toBe(false);
  });

  it("no encuentra nada si todos los campos están vacíos", () => {
    expect(matchesQuery([undefined, ""], "algo")).toBe(false);
  });
});

describe("compareText", () => {
  it("ordena en español sin distinguir mayúsculas ni tildes", () => {
    expect(["zapato", "Ábaco", "casa", "Ñu", "nube"].sort(compareText)).toEqual(["Ábaco", "casa", "nube", "Ñu", "zapato"]);
  });

  it("ordena los números de forma natural", () => {
    expect(["Tornillo 10", "Tornillo 2"].sort(compareText)).toEqual(["Tornillo 2", "Tornillo 10"]);
  });

  it("considera iguales textos que solo cambian en mayúsculas", () => {
    expect(compareText("casa", "CASA")).toBe(0);
  });
});

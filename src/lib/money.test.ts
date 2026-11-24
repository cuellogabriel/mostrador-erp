import { describe, expect, it } from "vitest";
import { centsToInput, formatEUR, toCents } from "@/lib/money";

/** Intl usa espacio duro antes del símbolo €; lo normalizamos para leer mejor los tests. */
const eur = (cents: number) => formatEUR(cents).replace(/ /g, " ");

describe("toCents", () => {
  it.each([
    ["12,50", 1250],
    ["12.50", 1250],
    ["12,5", 1250],
    ["7", 700],
    ["0", 0],
    ["0,00", 0],
    ["0,01", 1],
    ["1.234,56", 123456],
    ["1.500", 150000],
    ["1.234.567,89", 123456789],
    ["1.5", 150],
    [" 12,50 € ", 1250],
    ["12,50 €", 1250],
    ["-3,20", -320],
    ["-0", 0],
  ])("convierte %j en %i céntimos", (input, expected) => {
    expect(toCents(input)).toBe(expected);
  });

  it.each(["", "   ", "abc", "12,505", "1.2345", "1,2,3", "12.", ",5", "1.23.4", "12a", "--1", "1.23,4.5"])(
    "rechaza %j",
    (input) => {
      expect(toCents(input)).toBeNull();
    },
  );
});

describe("formatEUR", () => {
  it("formatea en es-ES con el símbolo detrás", () => {
    expect(eur(1250)).toBe("12,50 €");
  });

  it("formatea cero y un céntimo", () => {
    expect(eur(0)).toBe("0,00 €");
    expect(eur(1)).toBe("0,01 €");
  });

  it("formatea negativos", () => {
    expect(eur(-320)).toBe("-3,20 €");
  });

  it("agrupa los miles a partir de cinco cifras", () => {
    expect(eur(1234567)).toBe("12.345,67 €");
  });

  it("rechaza importes que no son céntimos enteros", () => {
    expect(() => formatEUR(12.5)).toThrow(RangeError);
    expect(() => formatEUR(Number.NaN)).toThrow(RangeError);
  });
});

describe("centsToInput", () => {
  it.each([
    [1250, "12,50"],
    [1205, "12,05"],
    [0, "0,00"],
    [7, "0,07"],
    [123456, "1234,56"],
    [-320, "-3,20"],
  ])("convierte %i en %j", (cents, expected) => {
    expect(centsToInput(cents)).toBe(expected);
  });

  it("es la inversa de toCents", () => {
    for (const cents of [0, 1, 99, 100, 1250, 999999]) {
      expect(toCents(centsToInput(cents))).toBe(cents);
    }
  });

  it("rechaza importes que no son céntimos enteros", () => {
    expect(() => centsToInput(1.5)).toThrow(RangeError);
  });
});

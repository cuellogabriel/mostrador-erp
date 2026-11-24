import { describe, expect, it } from "vitest";
import { formatDate, formatLongDate } from "@/lib/dates";

describe("formatDate", () => {
  it("formatea como dd/mm/aaaa con ceros a la izquierda", () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe("05/01/2026");
  });

  it("usa el día local aunque sea tarde por la noche", () => {
    expect(formatDate(new Date(2026, 11, 31, 23, 59))).toBe("31/12/2026");
  });

  it("formatea el 29 de febrero de un año bisiesto", () => {
    expect(formatDate(new Date(2028, 1, 29))).toBe("29/02/2028");
  });

  it("rechaza fechas no válidas", () => {
    expect(() => formatDate(new Date("no es una fecha"))).toThrow(RangeError);
  });
});

describe("formatLongDate", () => {
  it("escribe el día de la semana, el día y el mes en español", () => {
    expect(formatLongDate(new Date(2026, 10, 24))).toBe("martes, 24 de noviembre de 2026");
    expect(formatLongDate(new Date(2027, 0, 1))).toBe("viernes, 1 de enero de 2027");
  });

  it("rechaza fechas no válidas", () => {
    expect(() => formatLongDate(new Date(Number.NaN))).toThrow(RangeError);
  });
});

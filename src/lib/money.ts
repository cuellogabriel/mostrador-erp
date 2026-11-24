const eurFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

/**
 * Convierte un importe escrito por el usuario ("12,50", "1.234,5", "7") a céntimos.
 * Acepta coma o punto decimal, puntos de miles, espacios y el símbolo €.
 * Devuelve `null` si el texto no es un importe válido o tiene más de 2 decimales.
 */
export function toCents(input: string): number | null {
  const cleaned = input.replace(/[\s\u00a0€]/g, "");
  const match = /^(-?)(\d+(?:[.,]\d+)*)$/.exec(cleaned);
  if (!match) return null;

  const [, sign, body] = match;
  let integerPart: string;
  let fractionPart = "";

  const lastComma = body.lastIndexOf(",");
  if (lastComma !== -1) {
    // La coma es el separador decimal; los puntos solo pueden ser de miles.
    integerPart = body.slice(0, lastComma);
    fractionPart = body.slice(lastComma + 1);
    if (integerPart.includes(",")) return null;
    if (integerPart.includes(".")) {
      if (!/^\d{1,3}(\.\d{3})+$/.test(integerPart)) return null;
      integerPart = integerPart.replace(/\./g, "");
    }
  } else if (/^\d{1,3}(\.\d{3})+$/.test(body)) {
    // "1.500" o "1.234.567": puntos de miles.
    integerPart = body.replace(/\./g, "");
  } else {
    const parts = body.split(".");
    if (parts.length > 2) return null;
    [integerPart, fractionPart = ""] = parts;
  }

  if (fractionPart.length > 2) return null;

  const cents = Number(integerPart) * 100 + Number(fractionPart.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents)) return null;
  return sign === "-" && cents !== 0 ? -cents : cents;
}

/** Formatea céntimos como euros en formato español: 1250 → "12,50 €". */
export function formatEUR(cents: number): string {
  if (!Number.isInteger(cents)) {
    throw new RangeError(`El importe debe estar en céntimos enteros: ${cents}`);
  }
  return eurFormatter.format(cents / 100);
}

export type TaxIdType = "NIF" | "NIE" | "CIF";

export type TaxIdResult =
  | { valid: true; type: TaxIdType; normalized: string }
  | { valid: false };

const DNI_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";
const CIF_CONTROL_LETTERS = "JABCDEFGHI";
const NIE_PREFIX: Record<string, string> = { X: "0", Y: "1", Z: "2" };

function dniLetter(digits: string): string {
  return DNI_LETTERS[Number(digits) % 23];
}

function cifControlDigit(digits: string): number {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    const n = Number(digits[i]);
    if (i % 2 === 0) {
      const doubled = n * 2;
      sum += Math.floor(doubled / 10) + (doubled % 10);
    } else {
      sum += n;
    }
  }
  return (10 - (sum % 10)) % 10;
}

function isValidCif(value: string): boolean {
  const match = /^([ABCDEFGHJNPQRSUVW])(\d{7})([0-9A-J])$/.exec(value);
  if (!match) return false;
  const [, letter, digits, control] = match;
  const digit = cifControlDigit(digits);
  const expectedLetter = CIF_CONTROL_LETTERS[digit];

  if ("PQRSNW".includes(letter)) return control === expectedLetter;
  if ("ABEH".includes(letter)) return control === String(digit);
  return control === String(digit) || control === expectedLetter;
}

/**
 * Valida un NIF (DNI), NIE o CIF español comprobando la letra o dígito de control.
 * Ignora mayúsculas, espacios y guiones; devuelve el valor normalizado si es válido.
 */
export function validateSpanishTaxId(input: string): TaxIdResult {
  const value = input.toUpperCase().replace(/[\s-]/g, "");

  const nif = /^(\d{8})([A-Z])$/.exec(value);
  if (nif) {
    return nif[2] === dniLetter(nif[1])
      ? { valid: true, type: "NIF", normalized: value }
      : { valid: false };
  }

  const nie = /^([XYZ])(\d{7})([A-Z])$/.exec(value);
  if (nie) {
    return nie[3] === dniLetter(NIE_PREFIX[nie[1]] + nie[2])
      ? { valid: true, type: "NIE", normalized: value }
      : { valid: false };
  }

  if (isValidCif(value)) return { valid: true, type: "CIF", normalized: value };
  return { valid: false };
}

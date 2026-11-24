/** Número de factura con el formato `F-AAAA-NNNN`: (2026, 7) → "F-2026-0007". */
export function formatInvoiceNumber(year: number, seq: number): string {
  if (!Number.isInteger(year) || year < 1000 || year > 9999) {
    throw new RangeError(`Año no válido: ${year}`);
  }
  if (!Number.isInteger(seq) || seq < 1) {
    throw new RangeError(`Número correlativo no válido: ${seq}`);
  }
  return `F-${year}-${String(seq).padStart(4, "0")}`;
}

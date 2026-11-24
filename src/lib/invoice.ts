import { VAT_RATES, type VatBreakdownEntry, type VatRate } from "./types";

export interface LineInput {
  quantity: number;
  unitPriceCents: number;
  vatRate: VatRate;
  /** Descuento en %, de 0 a 100, con hasta 2 decimales. */
  discountPct: number;
}

export interface LineTotals {
  baseCents: number;
  vatCents: number;
  totalCents: number;
}

export interface InvoiceTotals extends LineTotals {
  /** Una entrada por tipo de IVA presente, de mayor a menor tipo. */
  vatBreakdown: VatBreakdownEntry[];
}

/** División entera con redondeo "half up" para numeradores no negativos. */
function roundDiv(numerator: number, denominator: number): number {
  return Math.floor((2 * numerator + denominator) / (2 * denominator));
}

function assertLine(line: LineInput): void {
  if (!Number.isInteger(line.quantity) || line.quantity < 0) {
    throw new RangeError(`Cantidad no válida: ${line.quantity}`);
  }
  if (!Number.isInteger(line.unitPriceCents) || line.unitPriceCents < 0) {
    throw new RangeError(`Precio no válido: ${line.unitPriceCents}`);
  }
  if (!VAT_RATES.includes(line.vatRate)) {
    throw new RangeError(`Tipo de IVA no válido: ${line.vatRate}`);
  }
  const discountBasisPoints = line.discountPct * 100;
  if (
    !Number.isFinite(line.discountPct) ||
    line.discountPct < 0 ||
    line.discountPct > 100 ||
    Math.abs(discountBasisPoints - Math.round(discountBasisPoints)) > 1e-9
  ) {
    throw new RangeError(`Descuento no válido: ${line.discountPct}`);
  }
}

/** Totales de una línea: base con descuento e IVA, redondeados al céntimo. */
export function calcLine(line: LineInput): LineTotals {
  assertLine(line);
  const gross = line.quantity * line.unitPriceCents;
  const discountBasisPoints = Math.round(line.discountPct * 100);
  const baseCents = roundDiv(gross * (10_000 - discountBasisPoints), 10_000);
  const vatCents = roundDiv(baseCents * line.vatRate, 100);
  return { baseCents, vatCents, totalCents: baseCents + vatCents };
}

/** Totales de la factura sumando líneas ya redondeadas, con el IVA desglosado por tipo. */
export function calcInvoice(lines: readonly LineInput[]): InvoiceTotals {
  const byRate = new Map<VatRate, VatBreakdownEntry>();
  let baseCents = 0;
  let vatCents = 0;

  for (const line of lines) {
    const totals = calcLine(line);
    baseCents += totals.baseCents;
    vatCents += totals.vatCents;
    const entry = byRate.get(line.vatRate) ?? { rate: line.vatRate, baseCents: 0, vatCents: 0 };
    entry.baseCents += totals.baseCents;
    entry.vatCents += totals.vatCents;
    byRate.set(line.vatRate, entry);
  }

  const vatBreakdown = [...byRate.values()].sort((a, b) => b.rate - a.rate);
  return { baseCents, vatCents, totalCents: baseCents + vatCents, vatBreakdown };
}

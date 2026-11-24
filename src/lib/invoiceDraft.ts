import { calcInvoice, type InvoiceTotals, type LineInput } from "./invoice";
import { centsToInput, toCents } from "./money";
import { MAX_STOCK } from "./productForm";
import type { Customer, InvoiceLine, Product, VatRate } from "./types";

/** Línea del borrador tal y como la edita el usuario (los números son texto de inputs). */
export interface DraftLine {
  /** Identificador de la fila en la interfaz. */
  key: string;
  productId: string;
  name: string;
  vatRate: VatRate;
  /** Precio unitario sin IVA en euros ("12,50"). */
  unitPrice: string;
  quantity: string;
  /** Descuento en %; vacío = sin descuento. */
  discount: string;
}

export interface DraftLineErrors {
  unitPrice?: string;
  quantity?: string;
  discount?: string;
  stock?: string;
}

export interface DraftErrors {
  customer?: string;
  lines?: string;
  byLine: Record<string, DraftLineErrors>;
}

export type DraftCustomer = Pick<Customer, "id" | "name" | "taxId">;

export type DraftValidation =
  | { ok: true; customer: DraftCustomer; lines: InvoiceLine[]; totals: InvoiceTotals }
  | { ok: false; errors: DraftErrors };

/** Máximo de líneas por factura (el mismo límite que firestore.rules). */
export const MAX_INVOICE_LINES = 200;

/** Cantidad: entero de 1 en adelante. */
export function parseQuantity(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const n = Number(trimmed);
  return n >= 1 && n <= MAX_STOCK ? n : null;
}

/** Descuento en %: vacío es 0; de 0 a 100 con hasta 2 decimales, con coma o punto. */
export function parseDiscount(value: string): number | null {
  const trimmed = value.trim().replace("%", "").trim();
  if (trimmed === "") return 0;
  if (!/^\d{1,3}([.,]\d{1,2})?$/.test(trimmed)) return null;
  const n = Number(trimmed.replace(",", "."));
  return n <= 100 ? n : null;
}

/** Datos numéricos de la línea, o `null` si algún campo no es válido. */
export function draftLineInput(line: DraftLine): LineInput | null {
  const quantity = parseQuantity(line.quantity);
  const unitPriceCents = toCents(line.unitPrice);
  const discountPct = parseDiscount(line.discount);
  if (quantity === null || unitPriceCents === null || unitPriceCents < 0 || discountPct === null) return null;
  return { quantity, unitPriceCents, vatRate: line.vatRate, discountPct };
}

export function newDraftLine(product: Product, key: string): DraftLine {
  return {
    key,
    productId: product.id,
    name: product.name,
    vatRate: product.vatRate,
    unitPrice: centsToInput(product.priceCents),
    quantity: "1",
    discount: "",
  };
}

/** Añade un producto: si ya está en el borrador suma 1 a su cantidad; si no, crea una línea. */
export function addProductToDraft(lines: readonly DraftLine[], product: Product, key: string): DraftLine[] {
  const index = lines.findIndex((line) => line.productId === product.id);
  if (index === -1) return [...lines, newDraftLine(product, key)];
  return lines.map((line, i) => {
    if (i !== index) return line;
    const quantity = parseQuantity(line.quantity);
    return { ...line, quantity: String((quantity ?? 0) + 1) };
  });
}

/** Unidades pedidas de cada producto, sumando sus líneas con cantidad válida. */
export function requestedQuantities(lines: readonly DraftLine[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const line of lines) {
    const quantity = parseQuantity(line.quantity);
    if (quantity !== null) totals.set(line.productId, (totals.get(line.productId) ?? 0) + quantity);
  }
  return totals;
}

/** Totales en vivo: solo cuentan las líneas con todos sus datos válidos. */
export function draftTotals(lines: readonly DraftLine[]): InvoiceTotals {
  return calcInvoice(lines.map(draftLineInput).filter((line): line is LineInput => line !== null));
}

function onlyLeftText(n: number): string {
  if (n === 0) return "Producto agotado.";
  return n === 1 ? "Solo queda 1 unidad." : `Solo quedan ${n} unidades.`;
}

/**
 * Valida el borrador entero. `stock` es el stock disponible por id de producto
 * (`undefined` si el producto ya no existe).
 */
export function validateInvoiceDraft(input: {
  customer: DraftCustomer | null;
  lines: readonly DraftLine[];
  stock: Readonly<Record<string, number | undefined>>;
}): DraftValidation {
  const errors: DraftErrors = { byLine: {} };
  if (!input.customer) errors.customer = "Elige el cliente de la factura.";
  if (input.lines.length === 0) errors.lines = "Añade al menos un producto.";
  else if (input.lines.length > MAX_INVOICE_LINES)
    errors.lines = `Una factura puede tener como mucho ${MAX_INVOICE_LINES} líneas.`;

  const requested = requestedQuantities(input.lines);
  const parsed: LineInput[] = [];

  for (const line of input.lines) {
    const lineErrors: DraftLineErrors = {};
    const unitPriceCents = toCents(line.unitPrice);
    if (unitPriceCents === null) lineErrors.unitPrice = "Precio no válido (por ejemplo 12,50).";
    else if (unitPriceCents < 0) lineErrors.unitPrice = "El precio no puede ser negativo.";
    if (parseQuantity(line.quantity) === null) lineErrors.quantity = "Escribe una cantidad entera mayor que 0.";
    if (parseDiscount(line.discount) === null) lineErrors.discount = "El descuento va de 0 a 100 %.";

    const available = input.stock[line.productId];
    const wanted = requested.get(line.productId) ?? 0;
    if (available === undefined) lineErrors.stock = "Este producto ya no existe. Quítalo de la factura.";
    else if (wanted > available) lineErrors.stock = onlyLeftText(available);

    if (Object.keys(lineErrors).length > 0) errors.byLine[line.key] = lineErrors;
    const lineInput = draftLineInput(line);
    if (lineInput) parsed.push(lineInput);
  }

  if (!input.customer || errors.lines || Object.keys(errors.byLine).length > 0) {
    return { ok: false, errors };
  }

  const lines: InvoiceLine[] = input.lines.map((line, i) => ({
    productId: line.productId,
    name: line.name,
    quantity: parsed[i].quantity,
    unitPriceCents: parsed[i].unitPriceCents,
    vatRate: parsed[i].vatRate,
    discountPct: parsed[i].discountPct,
  }));
  return { ok: true, customer: input.customer, lines, totals: calcInvoice(parsed) };
}

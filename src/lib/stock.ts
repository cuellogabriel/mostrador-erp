export type StockStatus = "out" | "low" | "ok";

/** Se lanza cuando una operación dejaría el stock por debajo de 0. */
export class InsufficientStockError extends Error {
  constructor(
    readonly available: number,
    /** Producto afectado, si se conoce (por ejemplo, al emitir una factura). */
    readonly productName?: string,
  ) {
    super(`No hay stock suficiente (disponible: ${available})`);
    this.name = "InsufficientStockError";
  }
}

/** Se lanza cuando una operación necesita un producto que ya se ha borrado. */
export class MissingProductError extends Error {
  constructor(readonly productName: string) {
    super(`El producto ${productName} ya no existe`);
    this.name = "MissingProductError";
  }
}

/** Agotado si no queda stock; bajo si está en el mínimo o por debajo. */
export function stockStatus(stock: number, minStock: number): StockStatus {
  if (stock <= 0) return "out";
  if (stock <= minStock) return "low";
  return "ok";
}

/** `true` para productos con stock bajo o agotados (filtro "solo stock bajo"). */
export function needsRestock(product: { stock: number; minStock: number }): boolean {
  return stockStatus(product.stock, product.minStock) !== "ok";
}

/** Nuevo stock tras sumar `delta` (negativo para restar). Nunca baja de 0. */
export function applyStockDelta(stock: number, delta: number): number {
  if (!Number.isInteger(stock) || stock < 0) throw new RangeError(`Stock no válido: ${stock}`);
  if (!Number.isInteger(delta)) throw new RangeError(`Cantidad no válida: ${delta}`);
  const next = stock + delta;
  if (next < 0) throw new InsufficientStockError(stock);
  return next;
}

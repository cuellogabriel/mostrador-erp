import { InsufficientStockError, MissingProductError } from "./stock";

const MESSAGES: Record<string, string> = {
  "permission-denied": "No tienes permiso para hacer esto. Cierra sesión y vuelve a entrar.",
  unauthenticated: "Tu sesión ha caducado. Vuelve a iniciar sesión.",
  unavailable: "No hay conexión con el servidor. Revisa tu red e inténtalo de nuevo.",
  "deadline-exceeded": "El servidor está tardando demasiado. Inténtalo de nuevo.",
  "not-found": "Este registro ya no existe. Puede que se haya borrado.",
  "resource-exhausted": "Se ha superado el límite de uso. Inténtalo dentro de un rato.",
  aborted: "Otra operación ha cambiado los datos a la vez. Inténtalo de nuevo.",
};

/** Se lanza al facturar a un cliente que se ha borrado mientras tanto. */
export class MissingCustomerError extends Error {
  constructor() {
    super("El cliente ya no existe");
    this.name = "MissingCustomerError";
  }
}

/** Se lanza al intentar cargar los datos de ejemplo en una cuenta que ya tiene datos. */
export class SeedNotEmptyError extends Error {
  constructor() {
    super("La cuenta ya tiene datos");
    this.name = "SeedNotEmptyError";
  }
}

/** Se lanza si la carga de datos de ejemplo falla después de haber escrito algo. */
export class SeedInterruptedError extends Error {
  constructor(readonly cause: unknown) {
    super("La carga de datos de ejemplo se interrumpió");
    this.name = "SeedInterruptedError";
  }
}

const FALLBACK = "Algo ha fallado al guardar o cargar los datos. Inténtalo de nuevo.";

/** Traduce un error de Firestore (o de la lógica de stock) a un mensaje en español. */
export function dataErrorMessage(error: unknown): string {
  if (error instanceof InsufficientStockError) {
    const left = error.available === 1 ? "queda 1 unidad" : `quedan ${error.available} unidades`;
    const of = error.productName ? ` de «${error.productName}»` : "";
    return `No hay stock suficiente${of}: ${left}.`;
  }
  if (error instanceof SeedNotEmptyError) {
    return "Ya tienes clientes, productos o facturas: los datos de ejemplo solo se cargan en una cuenta vacía.";
  }
  if (error instanceof SeedInterruptedError) {
    return `Se cargaron datos parciales: la carga se interrumpió (${dataErrorMessage(error.cause).replace(/.$/, "")}). Borra la cuenta o sigue a mano.`;
  }
  if (error instanceof MissingCustomerError) {
    return "El cliente ya no existe. Puede que se haya borrado: elige otro.";
  }
  if (error instanceof MissingProductError) {
    return `El producto «${error.productName}» ya no existe. Quítalo de la factura.`;
  }
  if (typeof error === "object" && error !== null && "code" in error) {
    const { code } = error;
    if (typeof code === "string" && Object.hasOwn(MESSAGES, code)) return MESSAGES[code];
  }
  return FALLBACK;
}

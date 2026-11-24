import { invoiceYear } from "./numbering";
import type { BusinessProfile, CustomerInput, ProductInput } from "./types";

/** Línea de una factura de ejemplo; los productos van por posición en `products`. */
export interface SeedLine {
  productIndex: number;
  quantity: number;
  discountPct: number;
}

export interface SeedInvoice {
  customerIndex: number;
  lines: SeedLine[];
  issuedAt: Date;
  /** Qué hacer tras emitirla: dejarla pendiente, cobrarla o anularla. */
  outcome: "pending" | "paid" | "void";
  paidAt?: Date;
}

export interface SeedPlan {
  business: BusinessProfile;
  customers: CustomerInput[];
  /** Con el stock inicial necesario para que, tras las facturas, quede `finalStock`. */
  products: ProductInput[];
  finalStock: number[];
  invoices: SeedInvoice[];
}

// Todo es ficticio: empresas con "Ejemplo"/"Demo" en el nombre, emails en @ejemplo.es,
// teléfonos 600 000 0XX y NIF/CIF generados solo para que pasen la validación de formato.
const BUSINESS: BusinessProfile = {
  name: "Ferretería Ejemplo S.L.",
  taxId: "B86421351",
  address: "Calle Ejemplo 42, 28005 Madrid",
  email: "hola@ejemplo.es",
  phone: "600 000 000",
};

const CUSTOMERS: CustomerInput[] = [
  { name: "Reformas Ejemplo Centro S.L.", taxId: "B28753192", email: "obras@ejemplo.es", phone: "600 000 001", address: "Calle Ejemplo 120, 28046 Madrid" },
  { name: "Construcciones Demo S.A.", taxId: "A28104628", email: "compras@ejemplo.es", phone: "600 000 002", address: "Plaza Ficticia 8, 47001 Valladolid" },
  { name: "Lucía Ejemplo Gómez", taxId: "50123456Q", email: "lucia@ejemplo.es", phone: "600 000 003" },
  { name: "Instalaciones Demo Levante S.L.", taxId: "B45612389", email: "info@ejemplo.es", phone: "600 000 004", address: "Avenida Inventada 15, 46021 Valencia" },
  { name: "Javier Prueba Ortega", taxId: "71845239R", phone: "600 000 005", notes: "Paga al contado." },
  { name: "Mantenimientos Ejemplo Norte S.L.", taxId: "B83124701", email: "admin@ejemplo.es", address: "Calle Ficticia 210, 28020 Madrid" },
  { name: "Andrei Demo Popescu", taxId: "X4521873G", email: "andrei@ejemplo.es", phone: "600 000 007" },
  { name: "Pinturas Ejemplo Sierra S.L.", taxId: "B62901541", email: "pedidos@ejemplo.es", phone: "600 000 008", notes: "Pedido grande cada mes. Pago a 30 días." },
];

/** Catálogo con su stock final deseado (algunos bajo mínimo y uno agotado). */
const PRODUCTS: (Omit<ProductInput, "stock"> & { finalStock: number })[] = [
  { name: "Taladro percutor 800 W", sku: "HER-TAL-800", priceCents: 8990, vatRate: 21, minStock: 3, finalStock: 9 },
  { name: "Juego de destornilladores (12 piezas)", sku: "HER-DES-12", priceCents: 1850, vatRate: 21, minStock: 5, finalStock: 24 },
  { name: "Cinta métrica 5 m", sku: "MED-CIN-5", priceCents: 695, vatRate: 21, minStock: 10, finalStock: 0 },
  { name: "Caja de tornillos 4×40 (500 u.)", sku: "TOR-440-500", priceCents: 1240, vatRate: 21, minStock: 8, finalStock: 31 },
  { name: "Pintura plástica blanca 15 L", sku: "PIN-BLA-15", priceCents: 4500, vatRate: 21, minStock: 6, finalStock: 14 },
  { name: "Guantes de trabajo (par)", sku: "EPI-GUA-01", priceCents: 390, vatRate: 21, minStock: 20, finalStock: 20 },
  { name: "Silicona transparente 300 ml", sku: "SEL-SIL-300", priceCents: 525, vatRate: 21, minStock: 12, finalStock: 40 },
  { name: "Escalera de aluminio 5 peldaños", sku: "ESC-ALU-5", priceCents: 6900, vatRate: 21, minStock: 2, finalStock: 5 },
  { name: "Manual de bricolaje en casa", sku: "LIB-BRI-01", priceCents: 1990, vatRate: 4, minStock: 3, finalStock: 7 },
  { name: "Brocas para hormigón (juego de 8)", sku: "HER-BRO-8", priceCents: 1475, vatRate: 21, minStock: 6, finalStock: 4 },
  { name: "Agua mineral (pack de 6 × 1,5 L)", sku: "ALI-AGU-6", priceCents: 330, vatRate: 10, minStock: 10, finalStock: 36 },
  { name: "Curso de soldadura básica (formación exenta)", sku: "FOR-SOL-01", priceCents: 12000, vatRate: 0, minStock: 0, finalStock: 6 },
];

const MONTHS = 6;
const DAYS = [4, 13, 22] as const;
const VOID_AT = new Set([4, 13]);
/** Margen para no fechar nada en el futuro aunque el reloj del dispositivo vaya algo adelantado. */
const SAFETY_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function invoiceLines(index: number, monthIndex: number): SeedLine[] {
  const first = (index * 5) % PRODUCTS.length;
  const second = (index * 7 + 3) % PRODUCTS.length;
  const quantity = 1 + (index % 3) + Math.floor(monthIndex / 2);
  const lines: SeedLine[] = [{ productIndex: first, quantity, discountPct: index % 5 === 0 ? 10 : 0 }];
  if (second !== first) lines.push({ productIndex: second, quantity: 1 + (index % 2), discountPct: 0 });
  return lines;
}

/**
 * Plan determinista de datos de ejemplo para `now`: emisor, 8 clientes, 12 productos y
 * ~18 facturas en orden cronológico durante los últimos 6 meses. Solo usa fechas del año
 * UTC en curso y anteriores a `now` (es lo que permiten las reglas de numeración).
 */
export function buildSeedPlan(now: Date): SeedPlan {
  const year = invoiceYear(now);
  const limit = now.getTime() - SAFETY_MS;
  const invoices: SeedInvoice[] = [];
  let index = 0;

  for (let monthIndex = 0; monthIndex < MONTHS; monthIndex++) {
    const monthsAgo = MONTHS - 1 - monthIndex;
    for (const day of DAYS) {
      const issuedAt = new Date(now.getFullYear(), now.getMonth() - monthsAgo, day, 10, index);
      if (issuedAt.getTime() > limit || issuedAt.getUTCFullYear() !== year) continue;
      const paidAt = new Date(issuedAt.getTime() + (8 + (index % 3) * 5) * DAY_MS);
      const outcome = VOID_AT.has(index)
        ? "void"
        : paidAt.getTime() <= limit && index % 4 !== 3
          ? "paid"
          : "pending";
      invoices.push({
        customerIndex: index % CUSTOMERS.length,
        lines: invoiceLines(index, monthIndex),
        issuedAt,
        outcome,
        ...(outcome === "paid" ? { paidAt } : {}),
      });
      index += 1;
    }
  }

  // Stock inicial = stock final + lo vendido en facturas que no se anulan.
  const sold = PRODUCTS.map(() => 0);
  for (const invoice of invoices) {
    if (invoice.outcome === "void") continue;
    for (const line of invoice.lines) sold[line.productIndex] += line.quantity;
  }

  return {
    business: BUSINESS,
    customers: CUSTOMERS,
    products: PRODUCTS.map(({ finalStock, ...product }, i) => ({ ...product, stock: finalStock + sold[i] })),
    finalStock: PRODUCTS.map((product) => product.finalStock),
    invoices,
  };
}

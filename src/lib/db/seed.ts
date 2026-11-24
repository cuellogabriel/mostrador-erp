import { getDoc, getDocs, limit, query } from "firebase/firestore";
import { SeedInterruptedError, SeedNotEmptyError } from "@/lib/dataErrors";
import { counterKey, invoiceYear } from "@/lib/numbering";
import { buildSeedPlan } from "@/lib/seedPlan";
import type { InvoiceLine } from "@/lib/types";
import { saveBusiness } from "./business";
import { createCustomer } from "./customers";
import { createInvoice, markInvoicePaid, voidInvoice } from "./invoices";
import { countersDoc, userCollection, type UserCollection } from "./paths";
import { createProduct } from "./products";

async function isEmpty(uid: string, name: UserCollection): Promise<boolean> {
  return (await getDocs(query(userCollection(uid, name), limit(1)))).empty;
}

/**
 * Carga los datos de ejemplo para el usuario actual con las mismas funciones que la app
 * (transacciones de factura, cobro y anulación), así el stock final cuadra.
 * Se niega si ya hay clientes, productos o facturas (o el contador del año no está a 0):
 * las facturas de ejemplo llevan fechas pasadas y la numeración tiene que seguir a las fechas.
 * Si falla después de escribir algo, lanza `SeedInterruptedError` (quedan datos parciales).
 */
export async function seedDemoData(uid: string, onProgress?: (done: number, total: number) => void): Promise<number> {
  const now = new Date();
  const [noCustomers, noProducts, noInvoices, counters] = await Promise.all([
    isEmpty(uid, "customers"),
    isEmpty(uid, "products"),
    isEmpty(uid, "invoices"),
    getDoc(countersDoc(uid)),
  ]);
  const counter: unknown = counters.exists() ? counters.get(counterKey(invoiceYear(now))) : undefined;
  if (!noCustomers || !noProducts || !noInvoices || (typeof counter === "number" && counter > 0)) {
    throw new SeedNotEmptyError();
  }

  let written = 0;
  try {
    return await writePlan(uid, now, (done, total) => {
      written = done;
      onProgress?.(done, total);
    });
  } catch (error) {
    // Si aún no se había escrito nada, la cuenta sigue vacía: basta con reintentar.
    throw written > 0 ? new SeedInterruptedError(error) : error;
  }
}

async function writePlan(uid: string, now: Date, onProgress: (done: number, total: number) => void): Promise<number> {
  const plan = buildSeedPlan(now);
  const total = 1 + plan.customers.length + plan.products.length + plan.invoices.length;
  let done = 0;
  const step = () => onProgress(++done, total);

  await saveBusiness(uid, plan.business);
  step();

  const customerIds: string[] = [];
  for (const customer of plan.customers) {
    customerIds.push(await createCustomer(uid, customer));
    step();
  }
  const productIds: string[] = [];
  for (const product of plan.products) {
    productIds.push(await createProduct(uid, product));
    step();
  }

  // En orden cronológico: la numeración correlativa sigue a las fechas.
  for (const invoice of plan.invoices) {
    const lines: InvoiceLine[] = invoice.lines.map((line) => {
      const product = plan.products[line.productIndex];
      return {
        productId: productIds[line.productIndex],
        name: product.name,
        quantity: line.quantity,
        unitPriceCents: product.priceCents,
        vatRate: product.vatRate,
        discountPct: line.discountPct,
      };
    });
    const number = await createInvoice(uid, { customerId: customerIds[invoice.customerIndex], lines }, { issuedAt: invoice.issuedAt });
    if (invoice.outcome === "void") await voidInvoice(uid, number);
    if (invoice.outcome === "paid") await markInvoicePaid(uid, number, invoice.paidAt);
    step();
  }
  return plan.invoices.length;
}

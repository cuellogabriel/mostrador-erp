import {
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentReference,
} from "firebase/firestore";
import { MissingCustomerError } from "@/lib/dataErrors";
import { db } from "@/lib/firebase";
import { calcInvoice } from "@/lib/invoice";
import { sortInvoices } from "@/lib/invoiceList";
import { counterKey, formatInvoiceNumber, invoiceYear } from "@/lib/numbering";
import { applyStockDelta, InsufficientStockError, MissingProductError } from "@/lib/stock";
import type { Invoice, InvoiceLine } from "@/lib/types";
import { customerFromSnapshot, invoiceFromSnapshot, productFromSnapshot } from "./convert";
import { countersDoc, userCollection, userDoc } from "./paths";
import type { Subscribe } from "./types";

/** Todas las facturas del usuario, de la más reciente a la más antigua. */
export function subscribeInvoices(uid: string): Subscribe<Invoice[]> {
  return (onData, onError) =>
    onSnapshot(
      userCollection(uid, "invoices"),
      (snapshot) => onData(sortInvoices(snapshot.docs.map(invoiceFromSnapshot))),
      onError,
    );
}

/** Facturas de un cliente, de la más reciente a la más antigua. */
export function subscribeCustomerInvoices(uid: string, customerId: string): Subscribe<Invoice[]> {
  return (onData, onError) =>
    onSnapshot(
      query(userCollection(uid, "invoices"), where("customerId", "==", customerId)),
      (snapshot) => onData(sortInvoices(snapshot.docs.map(invoiceFromSnapshot))),
      onError,
    );
}

/** Una factura en tiempo real (`null` si no existe). */
export function subscribeInvoice(uid: string, id: string): Subscribe<Invoice | null> {
  return (onData, onError) =>
    onSnapshot(
      userDoc(uid, "invoices", id),
      (snapshot) => onData(snapshot.exists() ? invoiceFromSnapshot(snapshot) : null),
      onError,
    );
}

/** Unidades por producto, sumando las líneas del mismo producto. */
function quantitiesByProduct(lines: readonly InvoiceLine[]): Map<string, { quantity: number; name: string }> {
  const totals = new Map<string, { quantity: number; name: string }>();
  for (const line of lines) {
    const current = totals.get(line.productId);
    totals.set(line.productId, { quantity: (current?.quantity ?? 0) + line.quantity, name: line.name });
  }
  return totals;
}

/**
 * Emite una factura en UNA transacción (D10):
 * lee el contador del año, el cliente y los productos; comprueba el stock;
 * escribe la factura (id = número), sube el contador y descuenta el stock.
 * Los importes salen solo de `calcInvoice`. Devuelve el número (`F-AAAA-NNNN`).
 */
export async function createInvoice(
  uid: string,
  draft: { customerId: string; lines: readonly InvoiceLine[] },
): Promise<string> {
  const year = invoiceYear(new Date());
  const key = counterKey(year);
  const countersRef = countersDoc(uid);
  const requested = quantitiesByProduct(draft.lines);

  return runTransaction(db, async (transaction) => {
    // 1) Lecturas (todas antes de cualquier escritura).
    const countersSnap = await transaction.get(countersRef);
    const customerSnap = await transaction.get(userDoc(uid, "customers", draft.customerId));
    const productSnaps = await Promise.all(
      [...requested.keys()].map((id) => transaction.get(userDoc(uid, "products", id))),
    );

    if (!customerSnap.exists()) throw new MissingCustomerError();
    const customer = customerFromSnapshot(customerSnap);

    const stockUpdates: { ref: DocumentReference; stock: number }[] = [];
    for (const snap of productSnaps) {
      const { name, quantity } = requested.get(snap.id) ?? { name: "", quantity: 0 };
      if (!snap.exists()) throw new MissingProductError(name);
      const product = productFromSnapshot(snap);
      try {
        stockUpdates.push({ ref: snap.ref, stock: applyStockDelta(product.stock, -quantity) });
      } catch (error) {
        if (error instanceof InsufficientStockError) throw new InsufficientStockError(product.stock, product.name);
        throw error;
      }
    }

    const counterValue = countersSnap.exists() ? countersSnap.get(key) : undefined;
    const seq = (typeof counterValue === "number" && Number.isInteger(counterValue) ? counterValue : 0) + 1;
    const number = formatInvoiceNumber(year, seq);
    const totals = calcInvoice(draft.lines);

    // 2) Escrituras.
    transaction.set(userDoc(uid, "invoices", number), {
      number,
      year,
      seq,
      customerId: customer.id,
      customerName: customer.name,
      ...(customer.taxId ? { customerTaxId: customer.taxId } : {}),
      lines: draft.lines.map((line) => ({
        productId: line.productId,
        name: line.name,
        quantity: line.quantity,
        unitPriceCents: line.unitPriceCents,
        vatRate: line.vatRate,
        discountPct: line.discountPct,
      })),
      baseCents: totals.baseCents,
      vatCents: totals.vatCents,
      totalCents: totals.totalCents,
      vatBreakdown: totals.vatBreakdown,
      status: "pending",
      issuedAt: serverTimestamp(),
    });
    if (countersSnap.exists()) transaction.update(countersRef, { [key]: seq });
    else transaction.set(countersRef, { [key]: seq });
    for (const update of stockUpdates) transaction.update(update.ref, { stock: update.stock });

    return number;
  });
}

export async function markInvoicePaid(uid: string, id: string): Promise<void> {
  await updateDoc(userDoc(uid, "invoices", id), { status: "paid", paidAt: serverTimestamp() });
}

/**
 * Anula una factura y repone el stock de sus líneas en una transacción.
 * Los productos que ya no existen se saltan; devuelve sus nombres para avisar.
 */
export async function voidInvoice(uid: string, id: string): Promise<{ skippedProducts: string[] }> {
  const invoiceRef = userDoc(uid, "invoices", id);
  return runTransaction(db, async (transaction) => {
    const invoiceSnap = await transaction.get(invoiceRef);
    if (!invoiceSnap.exists()) throw Object.assign(new Error("Factura no encontrada"), { code: "not-found" });
    const invoice = invoiceFromSnapshot(invoiceSnap);
    if (invoice.status === "void") return { skippedProducts: [] };

    const returned = quantitiesByProduct(invoice.lines);
    const productSnaps = await Promise.all(
      [...returned.keys()].map((productId) => transaction.get(userDoc(uid, "products", productId))),
    );

    const skippedProducts: string[] = [];
    const stockUpdates: { ref: DocumentReference; stock: number }[] = [];
    for (const snap of productSnaps) {
      const { name, quantity } = returned.get(snap.id) ?? { name: "", quantity: 0 };
      if (!snap.exists()) {
        skippedProducts.push(name);
        continue;
      }
      stockUpdates.push({ ref: snap.ref, stock: applyStockDelta(productFromSnapshot(snap).stock, quantity) });
    }

    transaction.update(invoiceRef, { status: "void" });
    for (const update of stockUpdates) transaction.update(update.ref, { stock: update.stock });
    return { skippedProducts };
  });
}

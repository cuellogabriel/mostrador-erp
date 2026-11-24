import { addDoc, deleteDoc, deleteField, onSnapshot, runTransaction, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { compareText } from "@/lib/search";
import { applyStockDelta } from "@/lib/stock";
import type { Product, ProductInput } from "@/lib/types";
import { productFromSnapshot } from "./convert";
import { userCollection, userDoc } from "./paths";
import type { Subscribe } from "./types";

/** Todos los productos del usuario, en orden alfabético y en tiempo real. */
export function subscribeProducts(uid: string): Subscribe<Product[]> {
  return (onData, onError) =>
    onSnapshot(
      userCollection(uid, "products"),
      (snapshot) => onData(snapshot.docs.map(productFromSnapshot).sort((a, b) => compareText(a.name, b.name))),
      onError,
    );
}

export async function createProduct(uid: string, input: ProductInput): Promise<string> {
  const ref = await addDoc(userCollection(uid, "products"), { ...input, createdAt: serverTimestamp() });
  return ref.id;
}

/**
 * Sustituye los datos editables; si se vacía el SKU, se borra del documento.
 * El stock no se toca aquí (solo con `adjustStock` o las facturas), para no pisar cambios concurrentes.
 */
export async function updateProduct(uid: string, id: string, input: Omit<ProductInput, "stock">): Promise<void> {
  await updateDoc(userDoc(uid, "products", id), {
    name: input.name,
    sku: input.sku ?? deleteField(),
    priceCents: input.priceCents,
    vatRate: input.vatRate,
    minStock: input.minStock,
  });
}

/**
 * Suma o resta unidades en una transacción: lee el stock actual del servidor y
 * lanza `InsufficientStockError` si fuese a quedar por debajo de 0.
 */
export async function adjustStock(uid: string, id: string, delta: number): Promise<number> {
  const ref = userDoc(uid, "products", id);
  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw Object.assign(new Error("Producto no encontrado"), { code: "not-found" });
    const next = applyStockDelta(productFromSnapshot(snapshot).stock, delta);
    transaction.update(ref, { stock: next });
    return next;
  });
}

export async function deleteProduct(uid: string, id: string): Promise<void> {
  await deleteDoc(userDoc(uid, "products", id));
}

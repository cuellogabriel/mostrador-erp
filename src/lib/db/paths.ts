import { collection, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/** Colecciones privadas del usuario: todo cuelga de `users/{uid}/…` (D6). */
export type UserCollection = "customers" | "products" | "invoices";

export function userCollection(uid: string, name: UserCollection) {
  return collection(db, "users", uid, name);
}

export function userDoc(uid: string, name: UserCollection, id: string) {
  return doc(db, "users", uid, name, id);
}

export function countersDoc(uid: string) {
  return doc(db, "users", uid, "meta", "counters");
}

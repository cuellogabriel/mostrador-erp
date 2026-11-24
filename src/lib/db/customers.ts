import { addDoc, deleteDoc, deleteField, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { compareText } from "@/lib/search";
import type { Customer, CustomerInput } from "@/lib/types";
import { customerFromSnapshot } from "./convert";
import { userCollection, userDoc } from "./paths";
import type { Subscribe } from "./types";

/** Todos los clientes del usuario, en orden alfabético y en tiempo real. */
export function subscribeCustomers(uid: string): Subscribe<Customer[]> {
  return (onData, onError) =>
    onSnapshot(
      userCollection(uid, "customers"),
      (snapshot) => onData(snapshot.docs.map(customerFromSnapshot).sort((a, b) => compareText(a.name, b.name))),
      onError,
    );
}

/** Un cliente en tiempo real (`null` si no existe o se ha borrado). */
export function subscribeCustomer(uid: string, id: string): Subscribe<Customer | null> {
  return (onData, onError) =>
    onSnapshot(
      userDoc(uid, "customers", id),
      (snapshot) => onData(snapshot.exists() ? customerFromSnapshot(snapshot) : null),
      onError,
    );
}

export async function createCustomer(uid: string, input: CustomerInput): Promise<string> {
  const ref = await addDoc(userCollection(uid, "customers"), { ...input, createdAt: serverTimestamp() });
  return ref.id;
}

/** Sustituye los datos editables; los campos opcionales que se vacían se borran del documento. */
export async function updateCustomer(uid: string, id: string, input: CustomerInput): Promise<void> {
  await updateDoc(userDoc(uid, "customers", id), {
    name: input.name,
    taxId: input.taxId ?? deleteField(),
    email: input.email ?? deleteField(),
    phone: input.phone ?? deleteField(),
    address: input.address ?? deleteField(),
    notes: input.notes ?? deleteField(),
  });
}

export async function deleteCustomer(uid: string, id: string): Promise<void> {
  await deleteDoc(userDoc(uid, "customers", id));
}

import { onSnapshot, setDoc } from "firebase/firestore";
import type { BusinessProfile } from "@/lib/types";
import { businessFromSnapshot } from "./convert";
import { businessDoc } from "./paths";
import type { Subscribe } from "./types";

/** Datos del emisor en tiempo real (`null` si aún no se han configurado). */
export function subscribeBusiness(uid: string): Subscribe<BusinessProfile | null> {
  return (onData, onError) => onSnapshot(businessDoc(uid), (snapshot) => onData(businessFromSnapshot(snapshot)), onError);
}

/** Guarda los datos del emisor (sustituye el documento entero). */
export async function saveBusiness(uid: string, profile: BusinessProfile): Promise<void> {
  await setDoc(businessDoc(uid), profile);
}

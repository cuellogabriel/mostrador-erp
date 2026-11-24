import type { Unsubscribe } from "firebase/firestore";

/** Suscripción en tiempo real: llama a `onData` con cada cambio y devuelve cómo cancelarla. */
export type Subscribe<T> = (onData: (data: T) => void, onError: (error: unknown) => void) => Unsubscribe;

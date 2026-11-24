"use client";

import { useSyncExternalStore } from "react";

/**
 * Peticiones de una pantalla a otra (por ejemplo, la paleta de comandos pide "nuevo cliente"
 * y la lista de clientes abre su panel). Se guarda una sola petición pendiente.
 */
export type Intent = "new-customer" | "new-product";

let pending: Intent | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function requestIntent(intent: Intent) {
  pending = intent;
  notify();
}

export function clearIntent(intent: Intent) {
  if (pending !== intent) return;
  pending = null;
  notify();
}

/** `true` mientras `intent` esté pendiente. */
export function useIntent(intent: Intent): boolean {
  return useSyncExternalStore(
    subscribe,
    () => pending === intent,
    () => false,
  );
}

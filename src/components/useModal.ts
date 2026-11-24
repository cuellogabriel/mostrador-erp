"use client";

import { useEffect, useEffectEvent, type RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Pila de modales abiertos: solo el de arriba atiende Esc y Tab. Así, si se abre la paleta
 * de comandos encima de un panel, Esc cierra solo la paleta y el panel conserva lo escrito.
 */
const openModals: symbol[] = [];

/**
 * Comportamiento común de diálogos modales: foco atrapado dentro de `ref`,
 * Esc cierra, el fondo no hace scroll y al cerrar el foco vuelve a donde estaba.
 */
export function useModal(ref: RefObject<HTMLElement | null>, onClose: () => void) {
  const close = useEffectEvent(onClose);

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const token = Symbol("modal");
    openModals.push(token);
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusables = () => Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
    const initial = container.querySelector<HTMLElement>("[data-autofocus]") ?? focusables()[0] ?? container;
    initial.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (openModals[openModals.length - 1] !== token) return;
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab" || !container) return;
      const items = focusables();
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !container.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !container.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      const index = openModals.indexOf(token);
      if (index !== -1) openModals.splice(index, 1);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [ref]);
}

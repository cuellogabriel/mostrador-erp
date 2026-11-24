"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { dataErrorMessage } from "@/lib/dataErrors";
import { adjustStock } from "@/lib/db/products";
import type { Product } from "@/lib/types";
import { useCurrentUser } from "../AuthProvider";
import { useToast } from "../ToastProvider";

const stepButton =
  "grid size-8 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent";

/** Ajuste rápido de stock (+1 / −1) con transacción; no deja bajar de 0. */
export function StockStepper({ product }: { product: Product }) {
  const { uid } = useCurrentUser();
  const { showToast } = useToast();
  const [pending, setPending] = useState(false);

  async function change(delta: number) {
    setPending(true);
    try {
      await adjustStock(uid, product.id, delta);
    } catch (error) {
      showToast(dataErrorMessage(error), "error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      role="group"
      aria-label={`Stock de ${product.name}`}
      aria-busy={pending || undefined}
      className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-sm"
    >
      <button
        type="button"
        className={stepButton}
        onClick={() => change(-1)}
        disabled={pending || product.stock <= 0}
        aria-label={`Restar una unidad de ${product.name}`}
      >
        <Minus className="size-3.5" aria-hidden="true" />
      </button>
      <output
        aria-live="polite"
        className={`min-w-10 px-1 text-center text-sm font-semibold tabular-nums ${pending ? "text-slate-500" : "text-slate-900"}`}
      >
        {product.stock}
      </output>
      <button
        type="button"
        className={stepButton}
        onClick={() => change(1)}
        disabled={pending}
        aria-label={`Sumar una unidad de ${product.name}`}
      >
        <Plus className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

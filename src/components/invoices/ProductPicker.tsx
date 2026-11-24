"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { formatEUR } from "@/lib/money";
import { matchesQuery } from "@/lib/search";
import type { Product } from "@/lib/types";
import { SearchInput } from "../SearchInput";
import { StockBadge } from "../products/StockBadge";

const MAX_RESULTS = 6;

interface ProductPickerProps {
  products: readonly Product[];
  onAdd: (product: Product) => void;
}

/** Buscador de productos para añadir líneas a la factura. */
export function ProductPicker({ products, onAdd }: ProductPickerProps) {
  const [query, setQuery] = useState("");
  const results = products.filter((p) => matchesQuery([p.name, p.sku], query)).slice(0, MAX_RESULTS);

  return (
    <div className="space-y-2">
      <SearchInput label="Buscar producto" placeholder="Añadir producto: busca por nombre o SKU" value={query} onChange={setQuery} />
      {results.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-5 text-center text-sm text-slate-500">
          Ningún producto coincide con «{query.trim()}».
        </p>
      ) : (
        <ul aria-label="Productos" className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
          {results.map((product) => {
            const soldOut = product.stock <= 0;
            return (
              <li key={product.id}>
                <button
                  type="button"
                  onClick={() => onAdd(product)}
                  disabled={soldOut}
                  aria-label={`Añadir ${product.name}${soldOut ? " (agotado)" : ""}`}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-slate-50 focus-visible:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-50/60"
                >
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm font-medium ${soldOut ? "text-slate-500" : "text-slate-900"}`}>
                      {product.name}
                    </span>
                    <span className="block text-xs text-slate-500">
                      <span className="tabular-nums">{formatEUR(product.priceCents)}</span> sin IVA · IVA {product.vatRate} % ·{" "}
                      {product.stock} en stock
                    </span>
                  </span>
                  <StockBadge stock={product.stock} minStock={product.minStock} />
                  {!soldOut && (
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                      <Plus className="size-4" aria-hidden="true" />
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

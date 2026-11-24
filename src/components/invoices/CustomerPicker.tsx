"use client";

import { UserRound } from "lucide-react";
import { useState } from "react";
import { matchesQuery } from "@/lib/search";
import type { Customer } from "@/lib/types";
import { SearchInput } from "../SearchInput";

const MAX_RESULTS = 8;

interface CustomerPickerProps {
  customers: readonly Customer[];
  selected: Customer | null;
  onSelect: (customer: Customer | null) => void;
}

/** Buscador de clientes: muestra el elegido o una lista para elegir. */
export function CustomerPicker({ customers, selected, onSelect }: CustomerPickerProps) {
  const [query, setQuery] = useState("");

  if (selected) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-emerald-700 ring-1 ring-emerald-200">
          <UserRound className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-slate-900">{selected.name}</p>
          <p className="truncate text-sm text-slate-600">
            {selected.taxId ?? "Sin NIF"}
            {selected.email ? ` · ${selected.email}` : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="h-9 shrink-0 rounded-lg px-3 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100"
        >
          Cambiar
        </button>
      </div>
    );
  }

  const results = customers.filter((c) => matchesQuery([c.name, c.taxId, c.email], query)).slice(0, MAX_RESULTS);
  return (
    <div className="space-y-2">
      <SearchInput
        label="Buscar cliente"
        placeholder="Buscar cliente por nombre, NIF o email"
        value={query}
        onChange={setQuery}
      />
      {results.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-5 text-center text-sm text-slate-500">
          Ningún cliente coincide con «{query.trim()}».
        </p>
      ) : (
        <ul aria-label="Clientes" className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
          {results.map((customer) => (
            <li key={customer.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(customer);
                  setQuery("");
                }}
                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition hover:bg-slate-50 focus-visible:bg-slate-50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-slate-900">{customer.name}</span>
                  {customer.taxId && <span className="block font-mono text-xs text-slate-500">{customer.taxId}</span>}
                </span>
                <span className="shrink-0 text-xs font-medium text-emerald-700">Elegir</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

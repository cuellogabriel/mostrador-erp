"use client";

import { TriangleAlert, X } from "lucide-react";
import { calcLine } from "@/lib/invoice";
import { draftLineInput, type DraftLine, type DraftLineErrors } from "@/lib/invoiceDraft";
import { formatEUR } from "@/lib/money";
import { IconButton } from "../IconButton";
import { TextField } from "../TextField";

interface DraftLineRowProps {
  line: DraftLine;
  errors?: DraftLineErrors;
  onChange: (patch: Partial<Pick<DraftLine, "unitPrice" | "quantity" | "discount">>) => void;
  onRemove: () => void;
}

/** Una línea editable del borrador de factura. */
export function DraftLineRow({ line, errors = {}, onChange, onRemove }: DraftLineRowProps) {
  const input = draftLineInput(line);
  const totals = input ? calcLine(input) : null;

  return (
    <fieldset className="rounded-xl border border-slate-200 bg-white p-4">
      <legend className="sr-only">{line.name}</legend>
      <div className="flex items-start justify-between gap-3">
        <p aria-hidden="true" className="min-w-0 pt-1.5 font-medium text-slate-900">
          {line.name}
        </p>
        <IconButton icon={X} label={`Quitar ${line.name}`} tone="danger" onClick={onRemove} />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <TextField
          label="Precio (€)"
          inputMode="decimal"
          autoComplete="off"
          value={line.unitPrice}
          onChange={(e) => onChange({ unitPrice: e.target.value })}
          error={errors.unitPrice}
        />
        <TextField
          label="Cantidad"
          inputMode="numeric"
          autoComplete="off"
          value={line.quantity}
          onChange={(e) => onChange({ quantity: e.target.value })}
          error={errors.quantity}
        />
        <TextField
          label="Dto. (%)"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          value={line.discount}
          onChange={(e) => onChange({ discount: e.target.value })}
          error={errors.discount}
        />
      </div>
      {errors.stock && (
        <p className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800" role="alert">
          <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
          {errors.stock}
        </p>
      )}
      <p className="mt-3 flex items-center justify-between text-sm text-slate-500">
        <span>IVA {line.vatRate} %</span>
        <span>
          Importe sin IVA:{" "}
          <span className="font-semibold text-slate-900 tabular-nums">{totals ? formatEUR(totals.baseCents) : "—"}</span>
        </span>
      </p>
    </fieldset>
  );
}

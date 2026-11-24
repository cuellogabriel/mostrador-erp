import type { InvoiceTotals } from "@/lib/invoice";
import { formatEUR } from "@/lib/money";

/** Base imponible, IVA desglosado por tipo y total. */
export function TotalsSummary({ totals }: { totals: InvoiceTotals }) {
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between gap-4">
        <dt className="text-slate-600">Base imponible</dt>
        <dd className="font-medium text-slate-900 tabular-nums">{formatEUR(totals.baseCents)}</dd>
      </div>
      {totals.vatBreakdown.length === 0 ? (
        <div className="flex justify-between gap-4">
          <dt className="text-slate-600">IVA</dt>
          <dd className="font-medium text-slate-900 tabular-nums">{formatEUR(0)}</dd>
        </div>
      ) : (
        totals.vatBreakdown.map((entry) => (
          <div key={entry.rate} className="flex justify-between gap-4">
            <dt className="text-slate-600">
              IVA {entry.rate} % <span className="text-slate-500">sobre {formatEUR(entry.baseCents)}</span>
            </dt>
            <dd className="font-medium text-slate-900 tabular-nums">{formatEUR(entry.vatCents)}</dd>
          </div>
        ))
      )}
      <div className="flex items-baseline justify-between gap-4 border-t border-slate-200 pt-3">
        <dt className="font-semibold text-slate-900">Total</dt>
        <dd className="text-xl font-semibold tracking-tight text-slate-900 tabular-nums">{formatEUR(totals.totalCents)}</dd>
      </div>
    </dl>
  );
}

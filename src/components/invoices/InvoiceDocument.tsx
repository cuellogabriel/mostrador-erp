import Link from "next/link";
import { formatDate } from "@/lib/dates";
import { calcLine } from "@/lib/invoice";
import { formatEUR } from "@/lib/money";
import type { Invoice } from "@/lib/types";
import { Logo } from "../Logo";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";
import { TotalsSummary } from "./TotalsSummary";

function formatDiscount(pct: number): string {
  return pct > 0 ? `${String(pct).replace(".", ",")} %` : "—";
}

/** La factura con aspecto de hoja A4 (también es lo que se imprime). */
export function InvoiceDocument({ invoice, issuerEmail }: { invoice: Invoice; issuerEmail: string | null }) {
  return (
    <article
      aria-label={`Factura ${invoice.number}`}
      className="mx-auto w-full max-w-[210mm] rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none"
    >
      <header className="flex flex-col gap-6 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Logo />
          {invoice.issuer ? (
            <address className="mt-4 text-sm text-slate-600 not-italic">
              <span className="block font-medium text-slate-900">{invoice.issuer.name}</span>
              <span className="block font-mono">{invoice.issuer.taxId}</span>
              <span className="block whitespace-pre-line">{invoice.issuer.address}</span>
              {invoice.issuer.email && <span className="block">{invoice.issuer.email}</span>}
              {invoice.issuer.phone && <span className="block">{invoice.issuer.phone}</span>}
            </address>
          ) : (
            <>
              <p className="mt-4 text-sm font-medium text-slate-900">Tu empresa</p>
              {issuerEmail && <p className="text-sm text-slate-600">{issuerEmail}</p>}
              <p className="mt-1 max-w-xs text-xs text-slate-500 print:hidden">
                Esta factura se emitió sin los datos fiscales de tu empresa.{" "}
                <Link href="/ajustes" className="font-medium text-emerald-700 hover:underline">
                  Complétalos en Ajustes
                </Link>{" "}
                para las próximas.
              </p>
            </>
          )}
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-semibold tracking-[0.2em] text-slate-500 uppercase">Factura</p>
          <p className="mt-1 font-mono text-xl font-semibold text-slate-900">{invoice.number}</p>
          <p className="mt-2 text-sm text-slate-600">Fecha: {formatDate(invoice.issuedAt)}</p>
          {invoice.paidAt && <p className="text-sm text-slate-600">Pagada el {formatDate(invoice.paidAt)}</p>}
          <div className="mt-2">
            <InvoiceStatusBadge status={invoice.status} />
          </div>
        </div>
      </header>

      <section aria-label="Cliente" className="py-6">
        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Facturar a</p>
        <p className="mt-1.5 font-medium text-slate-900">{invoice.customerName}</p>
        {invoice.customerTaxId && <p className="font-mono text-sm text-slate-600">{invoice.customerTaxId}</p>}
      </section>

      <div className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[34rem] text-sm">
          <caption className="sr-only">Líneas de la factura</caption>
          <thead>
            <tr className="border-y border-slate-200 text-xs tracking-wide text-slate-500 uppercase">
              <th scope="col" className="py-2.5 pr-3 text-left font-medium">Concepto</th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">Cant.</th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">Precio</th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">Dto.</th>
              <th scope="col" className="px-3 py-2.5 text-right font-medium">IVA</th>
              <th scope="col" className="py-2.5 pl-3 text-right font-medium">Importe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoice.lines.map((line, index) => (
              <tr key={`${line.productId}-${index}`}>
                <td className="py-3 pr-3 text-slate-900">{line.name}</td>
                <td className="px-3 py-3 text-right tabular-nums">{line.quantity}</td>
                <td className="px-3 py-3 text-right whitespace-nowrap tabular-nums">{formatEUR(line.unitPriceCents)}</td>
                <td className="px-3 py-3 text-right whitespace-nowrap tabular-nums">{formatDiscount(line.discountPct)}</td>
                <td className="px-3 py-3 text-right whitespace-nowrap tabular-nums">{line.vatRate} %</td>
                <td className="py-3 pl-3 text-right font-medium whitespace-nowrap text-slate-900 tabular-nums">
                  {formatEUR(calcLine(line).baseCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-end border-t border-slate-200 pt-6">
        <div className="w-full sm:max-w-xs">
          <TotalsSummary totals={invoice} />
        </div>
      </div>

      {invoice.status === "void" && (
        <p className="mt-8 rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-medium text-slate-700">
          Factura anulada: no tiene validez y su stock se ha repuesto.
        </p>
      )}
    </article>
  );
}

"use client";

import { FilePlus2, FileText } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useCustomerInvoices } from "@/hooks/useInvoices";
import { dataErrorMessage } from "@/lib/dataErrors";
import { formatDate } from "@/lib/dates";
import { summarizeInvoices } from "@/lib/invoiceList";
import { formatEUR } from "@/lib/money";
import type { Invoice } from "@/lib/types";
import { buttonClassName } from "../Button";
import { DataTable, type Column } from "../DataTable";
import { EmptyState } from "../EmptyState";
import { ErrorState } from "../ErrorState";
import { InvoiceStatusBadge } from "../invoices/InvoiceStatusBadge";
import { TableSkeleton } from "../TableSkeleton";

const columns: Column<Invoice>[] = [
  {
    id: "number",
    header: "Número",
    cell: (i) => (
      <Link href={`/facturas/${i.id}`} className="font-mono text-[13px] font-medium text-slate-900 hover:text-emerald-700 hover:underline">
        {i.number}
      </Link>
    ),
  },
  { id: "date", header: "Fecha", cell: (i) => formatDate(i.issuedAt), className: "tabular-nums" },
  {
    id: "total",
    header: "Total",
    align: "right",
    cell: (i) => (
      <span className={`font-medium tabular-nums ${i.status === "void" ? "text-slate-500 line-through" : "text-slate-900"}`}>
        {formatEUR(i.totalCents)}
      </span>
    ),
  },
  { id: "status", header: "Estado", align: "right", cell: (i) => <InvoiceStatusBadge status={i.status} /> },
];

/** Facturas del cliente y total facturado (sin contar las anuladas). */
export function CustomerInvoices({ customerId }: { customerId: string }) {
  const invoices = useCustomerInvoices(customerId);
  const summary = useMemo(
    () => (invoices.status === "ready" ? summarizeInvoices(invoices.data) : null),
    [invoices],
  );

  function renderContent() {
    if (invoices.status === "loading") return <TableSkeleton label="Cargando facturas del cliente…" rows={3} />;
    if (invoices.status === "error") {
      return (
        <ErrorState
          title="No se han podido cargar sus facturas"
          message={dataErrorMessage(invoices.error)}
          onRetry={invoices.retry}
        />
      );
    }
    if (invoices.data.length === 0) {
      return (
        <EmptyState
          icon={FileText}
          title="Aún no hay facturas para este cliente"
          description="Cuando le emitas una factura, aparecerá aquí con su estado y su importe."
          action={
            <Link href="/facturas/nueva" className={buttonClassName("primary")}>
              <FilePlus2 className="size-4" aria-hidden="true" />
              Nueva factura
            </Link>
          }
        />
      );
    }
    return (
      <DataTable
        caption="Facturas del cliente"
        columns={columns}
        rows={invoices.data}
        rowKey={(i) => i.id}
        mobileCard={(i) => (
          <Link href={`/facturas/${i.id}`} className="flex items-center justify-between gap-3">
            <span>
              <span className="block font-mono text-[13px] font-medium text-slate-900">{i.number}</span>
              <span className="block text-xs text-slate-500">{formatDate(i.issuedAt)}</span>
            </span>
            <span className="flex flex-col items-end gap-1">
              <span className={`font-semibold tabular-nums ${i.status === "void" ? "text-slate-500 line-through" : "text-slate-900"}`}>
                {formatEUR(i.totalCents)}
              </span>
              <InvoiceStatusBadge status={i.status} />
            </span>
          </Link>
        )}
      />
    );
  }

  return (
    <section aria-labelledby="customer-invoices-title" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="customer-invoices-title" className="text-lg font-semibold tracking-tight text-slate-900">
          Facturas
        </h2>
        {summary && (
          <p className="text-sm text-slate-600">
            Total facturado:{" "}
            <span className="font-semibold text-slate-900 tabular-nums">{formatEUR(summary.invoicedCents)}</span>
            {summary.pendingCents > 0 && (
              <span className="text-slate-500"> · pendiente {formatEUR(summary.pendingCents)}</span>
            )}
          </p>
        )}
      </div>
      {renderContent()}
    </section>
  );
}

"use client";

import { CircleCheck, Clock, FilePlus2, FileText, Plus, ReceiptText, SearchX } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useInvoices } from "@/hooks/useInvoices";
import { dataErrorMessage } from "@/lib/dataErrors";
import { formatDate } from "@/lib/dates";
import { countByStatus, filterInvoices, summarizeInvoices, type StatusFilter } from "@/lib/invoiceList";
import { formatEUR } from "@/lib/money";
import type { Invoice } from "@/lib/types";
import { Button, buttonClassName } from "../Button";
import { DataTable, type Column } from "../DataTable";
import { EmptyState } from "../EmptyState";
import { ErrorState } from "../ErrorState";
import { PageHeader } from "../PageHeader";
import { SearchInput } from "../SearchInput";
import { StatCard } from "../StatCard";
import { TableSkeleton } from "../TableSkeleton";
import { InvoiceStatusBadge } from "./InvoiceStatusBadge";

const FILTERS: readonly { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "Pendientes" },
  { value: "paid", label: "Pagadas" },
  { value: "void", label: "Anuladas" },
];

const columns: Column<Invoice>[] = [
  {
    id: "number",
    header: "Número",
    cell: (i) => (
      <Link
        href={`/facturas/${i.id}`}
        className="font-mono text-[13px] font-medium whitespace-nowrap text-slate-900 hover:text-emerald-700 hover:underline"
      >
        {i.number}
      </Link>
    ),
  },
  { id: "customer", header: "Cliente", cell: (i) => i.customerName, className: "max-w-64 truncate" },
  { id: "date", header: "Fecha", cell: (i) => formatDate(i.issuedAt), className: "whitespace-nowrap tabular-nums" },
  {
    id: "total",
    header: "Total",
    align: "right",
    cell: (i) => (
      <span className={`font-medium whitespace-nowrap tabular-nums ${i.status === "void" ? "text-slate-500 line-through" : "text-slate-900"}`}>
        {formatEUR(i.totalCents)}
      </span>
    ),
  },
  { id: "status", header: "Estado", align: "right", cell: (i) => <InvoiceStatusBadge status={i.status} /> },
];

const newInvoiceLink = (
  <Link href="/facturas/nueva" className={buttonClassName("primary")}>
    <Plus className="size-4" aria-hidden="true" />
    Nueva factura
  </Link>
);

export function InvoicesView() {
  const invoices = useInvoices();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  const all = useMemo(() => (invoices.status === "ready" ? invoices.data : []), [invoices]);
  const counts = useMemo(() => countByStatus(all), [all]);
  const summary = useMemo(() => summarizeInvoices(all), [all]);
  const filtered = useMemo(() => filterInvoices(all, status, query), [all, status, query]);

  function renderContent() {
    if (invoices.status === "loading") return <TableSkeleton label="Cargando facturas…" />;
    if (invoices.status === "error") {
      return (
        <ErrorState
          title="No se han podido cargar las facturas"
          message={dataErrorMessage(invoices.error)}
          onRetry={invoices.retry}
        />
      );
    }
    if (all.length === 0) {
      return (
        <EmptyState
          icon={FileText}
          title="Aún no has emitido facturas"
          description="Crea tu primera factura: elige un cliente, añade productos y los totales se calculan solos."
          action={
            <Link href="/facturas/nueva" className={buttonClassName("primary")}>
              <FilePlus2 className="size-4" aria-hidden="true" />
              Crear la primera factura
            </Link>
          }
        />
      );
    }

    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Facturado" value={formatEUR(summary.invoicedCents)} icon={ReceiptText} tone="emerald" hint="Sin contar las anuladas" />
          <StatCard label="Pendiente de cobro" value={formatEUR(summary.pendingCents)} icon={Clock} tone="amber" hint={`${counts.pending} ${counts.pending === 1 ? "factura" : "facturas"}`} />
          <StatCard label="Cobrado" value={formatEUR(summary.paidCents)} icon={CircleCheck} hint={`${counts.paid} ${counts.paid === 1 ? "factura" : "facturas"}`} />
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div role="group" aria-label="Filtrar por estado" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:pb-0">
            {FILTERS.map((filter) => {
              const active = status === filter.value;
              return (
                <button
                  key={filter.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setStatus(filter.value)}
                  className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm font-medium transition ${
                    active
                      ? "bg-slate-900 text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {filter.label}
                  <span
                    className={`rounded-full px-1.5 text-xs tabular-nums ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}
                  >
                    {counts[filter.value]}
                  </span>
                </button>
              );
            })}
          </div>
          <SearchInput
            label="Buscar facturas"
            placeholder="Buscar por número, cliente o NIF"
            value={query}
            onChange={setQuery}
            className="lg:w-80"
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Ninguna factura coincide"
            description="Prueba con otro número o cliente, o mira en otro estado."
            action={
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setQuery("");
                  setStatus("all");
                }}
              >
                Ver todas las facturas
              </Button>
            }
          />
        ) : (
          <DataTable
            caption="Facturas"
            columns={columns}
            rows={filtered}
            rowKey={(i) => i.id}
            mobileCard={(i) => (
              <Link href={`/facturas/${i.id}`} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[13px] font-medium text-slate-900">{i.number}</p>
                  <p className="mt-0.5 truncate text-sm text-slate-600">{i.customerName}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{formatDate(i.issuedAt)}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`font-semibold tabular-nums ${i.status === "void" ? "text-slate-500 line-through" : "text-slate-900"}`}>
                    {formatEUR(i.totalCents)}
                  </span>
                  <InvoiceStatusBadge status={i.status} />
                </div>
              </Link>
            )}
          />
        )}
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Facturas" description="Emite, cobra y consulta tus facturas." actions={newInvoiceLink} />
      {renderContent()}
    </>
  );
}

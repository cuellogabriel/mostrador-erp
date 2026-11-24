"use client";

import { ArrowRight, Clock, PackageX, ReceiptText, Store, Users } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { useBusiness } from "@/hooks/useBusiness";
import { useCustomers } from "@/hooks/useCustomers";
import { useInvoices } from "@/hooks/useInvoices";
import { useProducts } from "@/hooks/useProducts";
import {
  compareWithPreviousMonth,
  formatChange,
  greeting,
  latestInvoices,
  lowStockProducts,
  monthlyInvoiced,
} from "@/lib/dashboard";
import { dataErrorMessage } from "@/lib/dataErrors";
import { formatDate, formatLongDate } from "@/lib/dates";
import { summarizeInvoices } from "@/lib/invoiceList";
import { formatEUR } from "@/lib/money";
import { buttonClassName } from "../Button";
import { EmptyState } from "../EmptyState";
import { ErrorState } from "../ErrorState";
import { InvoiceStatusBadge } from "../invoices/InvoiceStatusBadge";
import { PageHeader } from "../PageHeader";
import { StockBadge } from "../products/StockBadge";
import { IssuerNotice } from "../settings/IssuerNotice";
import { StatCard } from "../StatCard";
import { RevenueChart } from "./RevenueChart";
import { SeedDataButton } from "./SeedDataButton";

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section aria-label={title} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function SeeAll({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800">
      {label}
      <ArrowRight className="size-4" aria-hidden="true" />
    </Link>
  );
}

function PanelSkeleton() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Cargando el panel…</span>
      <div aria-hidden="true" className="animate-pulse space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-32 rounded-2xl border border-slate-200/80 bg-white" />
          ))}
        </div>
        <div className="h-80 rounded-2xl border border-slate-200/80 bg-white" />
      </div>
    </div>
  );
}

export function PanelView() {
  const invoices = useInvoices();
  const customers = useCustomers();
  const products = useProducts();
  const business = useBusiness();
  const [now] = useState(() => new Date());

  const today = formatLongDate(now);
  const header = <PageHeader title={greeting(now)} description={today.charAt(0).toUpperCase() + today.slice(1)} />;

  const ready = invoices.status === "ready" && customers.status === "ready" && products.status === "ready";
  const data = useMemo(() => {
    if (invoices.status !== "ready" || products.status !== "ready") return null;
    return {
      months: monthlyInvoiced(invoices.data, now),
      comparison: compareWithPreviousMonth(invoices.data, now),
      summary: summarizeInvoices(invoices.data),
      pendingCount: invoices.data.filter((i) => i.status === "pending").length,
      latest: latestInvoices(invoices.data),
      lowStock: lowStockProducts(products.data),
    };
  }, [invoices, products, now]);

  const failed = [invoices, customers, products].find((state) => state.status === "error");
  if (failed && failed.status === "error") {
    return (
      <>
        {header}
        <ErrorState
          title="No se ha podido cargar el panel"
          message={dataErrorMessage(failed.error)}
          onRetry={() => {
            invoices.retry();
            customers.retry();
            products.retry();
          }}
        />
      </>
    );
  }
  if (!ready || !data) {
    return (
      <>
        {header}
        <PanelSkeleton />
      </>
    );
  }

  // Solo una cuenta vacía del todo puede cargar los datos de ejemplo (D10: numeración y fechas).
  if (customers.data.length === 0 && products.data.length === 0 && invoices.data.length === 0) {
    return (
      <>
        {header}
        <EmptyState
          icon={Store}
          title="Tu negocio aún está vacío"
          description="Carga unos datos de ejemplo para ver Mostrador en marcha (clientes, productos y facturas de los últimos meses), o empieza con los tuyos."
          action={
            <div className="flex flex-col items-center gap-3">
              <SeedDataButton />
              <Link href="/clientes" className="text-sm font-medium text-emerald-700 hover:underline">
                O empieza añadiendo un cliente
              </Link>
            </div>
          }
        />
      </>
    );
  }

  const { comparison, summary, months, latest, lowStock } = data;
  const monthHint =
    comparison.changePct === null
      ? "Sin facturación el mes anterior"
      : `${formatChange(comparison.changePct)} frente al mes anterior`;

  return (
    <>
      {header}
      <div className="space-y-6">
        {business.status === "ready" && !business.data && <IssuerNotice />}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Facturado este mes" value={formatEUR(comparison.currentCents)} icon={ReceiptText} tone="emerald" hint={monthHint} />
          <StatCard
            label="Pendiente de cobro"
            value={formatEUR(summary.pendingCents)}
            icon={Clock}
            tone="amber"
            hint={`${data.pendingCount} ${data.pendingCount === 1 ? "factura" : "facturas"}`}
          />
          <StatCard label="Clientes" value={customers.data.length.toLocaleString("es-ES")} icon={Users} hint="En tu cartera" />
          <StatCard
            label="Stock bajo"
            value={lowStock.length.toLocaleString("es-ES")}
            icon={PackageX}
            tone={lowStock.length > 0 ? "amber" : "slate"}
            hint={lowStock.length === 1 ? "producto por reponer" : "productos por reponer"}
          />
        </div>

        <Section title="Facturación de los últimos 6 meses">
          <p className="-mt-3 mb-4 text-sm text-slate-500">Sin contar las facturas anuladas. Importes con IVA.</p>
          <RevenueChart data={months} />
        </Section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Últimas facturas" action={<SeeAll href="/facturas" label="Ver todas" />}>
            {latest.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-slate-600">Aún no has emitido facturas.</p>
                <Link href="/facturas/nueva" className={buttonClassName("primary", "mt-4")}>
                  Crear una factura
                </Link>
              </div>
            ) : (
              <ul className="-mx-2 divide-y divide-slate-100">
                {latest.map((invoice) => (
                  <li key={invoice.id}>
                    <Link
                      href={`/facturas/${invoice.id}`}
                      className="flex items-center justify-between gap-3 rounded-xl px-2 py-3 transition hover:bg-slate-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-900">{invoice.customerName}</span>
                        <span className="block text-xs text-slate-500">
                          <span className="font-mono">{invoice.number}</span> · {formatDate(invoice.issuedAt)}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-3">
                        <span className={`text-sm font-semibold tabular-nums ${invoice.status === "void" ? "text-slate-500 line-through" : "text-slate-900"}`}>
                          {formatEUR(invoice.totalCents)}
                        </span>
                        <InvoiceStatusBadge status={invoice.status} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Stock bajo" action={<SeeAll href="/productos" label="Ir a productos" />}>
            {lowStock.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-600">Todo el stock está en orden.</p>
            ) : (
              <ul className="-mx-2 divide-y divide-slate-100">
                {lowStock.slice(0, 6).map((product) => (
                  <li key={product.id}>
                    <Link
                      href="/productos"
                      className="flex items-center justify-between gap-3 rounded-xl px-2 py-3 transition hover:bg-slate-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-900">{product.name}</span>
                        <span className="block text-xs text-slate-500">
                          Quedan {product.stock} · mínimo {product.minStock}
                        </span>
                      </span>
                      <StockBadge stock={product.stock} minStock={product.minStock} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}

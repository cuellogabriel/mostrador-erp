"use client";

import { ArrowLeft, Package, PackageSearch, Send, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useBusiness } from "@/hooks/useBusiness";
import { useCustomers } from "@/hooks/useCustomers";
import { useProducts } from "@/hooks/useProducts";
import { dataErrorMessage } from "@/lib/dataErrors";
import { createInvoice } from "@/lib/db/invoices";
import { addProductToDraft, draftTotals, validateInvoiceDraft, type DraftLine } from "@/lib/invoiceDraft";
import type { Product } from "@/lib/types";
import { useCurrentUser } from "../AuthProvider";
import { Button, buttonClassName } from "../Button";
import { EmptyState } from "../EmptyState";
import { ErrorState } from "../ErrorState";
import { FormAlert } from "../FormAlert";
import { PageHeader } from "../PageHeader";
import { IssuerNotice } from "../settings/IssuerNotice";
import { TableSkeleton } from "../TableSkeleton";
import { useToast } from "../ToastProvider";
import { CustomerPicker } from "./CustomerPicker";
import { DraftLineRow } from "./DraftLineRow";
import { ProductPicker } from "./ProductPicker";
import { TotalsSummary } from "./TotalsSummary";

const backLink = (
  <Link
    href="/facturas"
    className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900"
  >
    <ArrowLeft className="size-4" aria-hidden="true" />
    Facturas
  </Link>
);

function Card({ title, step, children }: { title: string; step: number; children: ReactNode }) {
  return (
    <section aria-label={title} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="mb-4 flex items-center gap-2.5 text-base font-semibold text-slate-900">
        <span className="grid size-6 place-items-center rounded-full bg-slate-900 text-xs text-white" aria-hidden="true">
          {step}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function NewInvoiceView() {
  const { uid } = useCurrentUser();
  const { showToast } = useToast();
  const router = useRouter();
  const customers = useCustomers();
  const products = useProducts();
  const business = useBusiness();
  const nextKey = useRef(0);

  const [customerId, setCustomerId] = useState<string | null>(null);
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const customerList = useMemo(() => (customers.status === "ready" ? customers.data : []), [customers]);
  const productList = useMemo(() => (products.status === "ready" ? products.data : []), [products]);
  // Cliente y stock salen de los datos en vivo: si cambian mientras se escribe, el aviso se actualiza.
  const customer = customerList.find((c) => c.id === customerId) ?? null;
  const stock = useMemo(() => Object.fromEntries(productList.map((p) => [p.id, p.stock])), [productList]);
  const validation = validateInvoiceDraft({ customer, lines, stock });
  const totals = validation.ok ? validation.totals : draftTotals(lines);
  const errors = validation.ok ? null : validation.errors;

  if (customers.status === "loading" || products.status === "loading") {
    return (
      <>
        {backLink}
        <PageHeader title="Nueva factura" />
        <TableSkeleton label="Cargando clientes y productos…" rows={4} />
      </>
    );
  }
  if (customers.status === "error" || products.status === "error") {
    const failed = customers.status === "error" ? customers : products;
    return (
      <>
        {backLink}
        <PageHeader title="Nueva factura" />
        <ErrorState
          title="No se han podido cargar los datos para facturar"
          message={dataErrorMessage(failed.status === "error" ? failed.error : null)}
          onRetry={() => {
            customers.retry();
            products.retry();
          }}
        />
      </>
    );
  }
  if (customerList.length === 0 || productList.length === 0) {
    const noCustomers = customerList.length === 0;
    return (
      <>
        {backLink}
        <PageHeader title="Nueva factura" />
        <EmptyState
          icon={noCustomers ? Users : Package}
          title={noCustomers ? "Primero necesitas un cliente" : "Primero necesitas productos"}
          description={
            noCustomers
              ? "Para emitir una factura, da de alta al menos un cliente."
              : "Para emitir una factura, añade al menos un producto a tu catálogo."
          }
          action={
            <Link href={noCustomers ? "/clientes" : "/productos"} className={buttonClassName("primary")}>
              {noCustomers ? "Ir a clientes" : "Ir a productos"}
            </Link>
          }
        />
      </>
    );
  }

  function addProduct(product: Product) {
    nextKey.current += 1;
    setLines((prev) => addProductToDraft(prev, product, `line-${nextKey.current}`));
  }

  function updateLine(key: string, patch: Partial<DraftLine>) {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (!validation.ok) return;
    setSubmitting(true);
    try {
      const number = await createInvoice(uid, { customerId: validation.customer.id, lines: validation.lines });
      // La página se conserva oculta al navegar: se limpia el borrador para la próxima factura.
      setCustomerId(null);
      setLines([]);
      setSubmitting(false);
      showToast(`Factura ${number} emitida`);
      router.push(`/facturas/${number}`);
    } catch (error) {
      setFormError(dataErrorMessage(error));
      setSubmitting(false);
    }
  }

  const hasLineErrors = errors ? Object.keys(errors.byLine).length > 0 : false;
  const pendingReasons = [
    errors?.customer,
    errors?.lines,
    hasLineErrors && "Revisa las líneas marcadas.",
  ].filter((reason): reason is string => typeof reason === "string");

  return (
    <>
      {backLink}
      <PageHeader title="Nueva factura" description="El número se asigna solo al emitirla." />
      {business.status === "ready" && !business.data && (
        <div className="mb-6">
          <IssuerNotice />
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <Card title="Cliente" step={1}>
            <CustomerPicker
              customers={customerList}
              selected={customer}
              onSelect={(c) => setCustomerId(c?.id ?? null)}
            />
          </Card>

          <Card title="Productos" step={2}>
            <ProductPicker products={productList} onAdd={addProduct} />
            <div className="mt-5 space-y-3">
              {lines.length === 0 ? (
                <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center">
                  <PackageSearch className="size-6 text-slate-500" aria-hidden="true" />
                  <p className="mt-2 text-sm text-slate-600">Busca un producto arriba y pulsa para añadirlo.</p>
                </div>
              ) : (
                lines.map((line) => (
                  <DraftLineRow
                    key={line.key}
                    line={line}
                    errors={errors?.byLine[line.key]}
                    onChange={(patch) => updateLine(line.key, patch)}
                    onRemove={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}
                  />
                ))
              )}
            </div>
          </Card>
        </div>

        <aside
          aria-label="Resumen de la factura"
          className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-6"
        >
          <h2 className="text-base font-semibold text-slate-900">Resumen</h2>
          <TotalsSummary totals={totals} />
          {formError && <FormAlert message={formError} />}
          <Button type="submit" className="w-full" loading={submitting} disabled={!validation.ok}>
            <Send className="size-4" aria-hidden="true" />
            Emitir factura
          </Button>
          {pendingReasons.length > 0 && (
            <ul className="space-y-1 text-sm text-slate-600" aria-live="polite">
              {pendingReasons.map((reason) => (
                <li key={reason}>· {reason}</li>
              ))}
            </ul>
          )}
          <p className="text-xs text-slate-500">
            Al emitirla se descuenta el stock y queda pendiente de cobro. Luego podrás marcarla como pagada o anularla.
          </p>
        </aside>
      </form>
    </>
  );
}

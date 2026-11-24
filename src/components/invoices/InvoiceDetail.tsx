"use client";

import { ArrowLeft, Ban, CircleCheckBig, FileX, MessageCircle, Printer } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { useInvoice } from "@/hooks/useInvoices";
import { dataErrorMessage } from "@/lib/dataErrors";
import { markInvoicePaid, voidInvoice } from "@/lib/db/invoices";
import { invoiceShareText, whatsAppShareUrl } from "@/lib/whatsapp";
import { useCurrentUser } from "../AuthProvider";
import { Button, buttonClassName } from "../Button";
import { ConfirmDialog } from "../ConfirmDialog";
import { EmptyState } from "../EmptyState";
import { ErrorState } from "../ErrorState";
import { useToast } from "../ToastProvider";
import { InvoiceDetailSkeleton } from "./InvoiceDetailSkeleton";
import { InvoiceDocument } from "./InvoiceDocument";

const backLink = (
  <Link
    href="/facturas"
    className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900 print:hidden"
  >
    <ArrowLeft className="size-4" aria-hidden="true" />
    Facturas
  </Link>
);

export function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const invoice = useInvoice(id);
  const user = useCurrentUser();
  const { showToast } = useToast();
  const [confirmingVoid, setConfirmingVoid] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);

  useLayoutEffect(() => () => setConfirmingVoid(false), []);

  if (invoice.status === "loading") return <InvoiceDetailSkeleton />;
  if (invoice.status === "error") {
    return (
      <>
        <div className="mb-6">{backLink}</div>
        <ErrorState title="No se ha podido cargar la factura" message={dataErrorMessage(invoice.error)} onRetry={invoice.retry} />
      </>
    );
  }
  if (!invoice.data) {
    return (
      <>
        <div className="mb-6">{backLink}</div>
        <EmptyState
          icon={FileX}
          title="Esta factura no existe"
          description="Revisa el número o vuelve al listado de facturas."
          action={
            <Link href="/facturas" className={buttonClassName("secondary")}>
              Ver todas las facturas
            </Link>
          }
        />
      </>
    );
  }

  const data = invoice.data;

  async function handleMarkPaid() {
    setMarkingPaid(true);
    try {
      await markInvoicePaid(user.uid, data.id);
      showToast(`Factura ${data.number} marcada como pagada`);
    } catch (error) {
      showToast(dataErrorMessage(error), "error");
    } finally {
      setMarkingPaid(false);
    }
  }

  return (
    <>
      <div className="mb-4">{backLink}</div>
      <div className="mb-6 flex flex-wrap gap-2 print:hidden">
        <Button type="button" variant="secondary" onClick={() => window.print()}>
          <Printer className="size-4" aria-hidden="true" />
          Imprimir / PDF
        </Button>
        <a
          href={whatsAppShareUrl(invoiceShareText(data))}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClassName("secondary")}
        >
          <MessageCircle className="size-4 text-emerald-600" aria-hidden="true" />
          Enviar por WhatsApp
          <span className="sr-only">(se abre en una ventana nueva)</span>
        </a>
        {data.status === "pending" && (
          <Button type="button" onClick={handleMarkPaid} loading={markingPaid}>
            <CircleCheckBig className="size-4" aria-hidden="true" />
            Marcar como pagada
          </Button>
        )}
        {data.status !== "void" && (
          <Button type="button" variant="secondary" onClick={() => setConfirmingVoid(true)}>
            <Ban className="size-4 text-rose-600" aria-hidden="true" />
            Anular
          </Button>
        )}
      </div>

      <InvoiceDocument invoice={data} issuerEmail={user.email} />

      {confirmingVoid && (
        <ConfirmDialog
          title={`¿Anular la factura ${data.number}?`}
          confirmLabel="Anular factura"
          errorMessage={dataErrorMessage}
          onClose={() => setConfirmingVoid(false)}
          onConfirm={async () => {
            const { skippedProducts } = await voidInvoice(user.uid, data.id);
            setConfirmingVoid(false);
            showToast(`Factura ${data.number} anulada y stock repuesto`);
            for (const name of skippedProducts) {
              showToast(`El producto «${name}» ya no existe; no se repuso su stock`, "error");
            }
          }}
        >
          <p>La factura seguirá en tu listado como anulada, con su número, y dejará de contar en lo facturado.</p>
          <p>Las unidades de sus líneas vuelven al stock. Esta acción no se puede deshacer.</p>
        </ConfirmDialog>
      )}
    </>
  );
}

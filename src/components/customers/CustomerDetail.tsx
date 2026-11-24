"use client";

import { ArrowLeft, Pencil, Trash2, UserX } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLayoutEffect, useState, type ReactNode } from "react";
import { useCustomer } from "@/hooks/useCustomers";
import { dataErrorMessage } from "@/lib/dataErrors";
import { formatDate } from "@/lib/dates";
import { deleteCustomer } from "@/lib/db/customers";
import type { Customer } from "@/lib/types";
import { useCurrentUser } from "../AuthProvider";
import { Button, buttonClassName } from "../Button";
import { ConfirmDialog } from "../ConfirmDialog";
import { EmptyState } from "../EmptyState";
import { ErrorState } from "../ErrorState";
import { PageHeader } from "../PageHeader";
import { useToast } from "../ToastProvider";
import { CustomerDetailSkeleton } from "./CustomerDetailSkeleton";
import { CustomerFormDrawer } from "./CustomerFormDrawer";
import { CustomerInvoices } from "./CustomerInvoices";

function DetailItem({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</dt>
      <dd className="mt-1 text-[15px] break-words text-slate-900">
        {children ?? <span className="text-slate-500">Sin indicar</span>}
      </dd>
    </div>
  );
}

const backLink = (
  <Link
    href="/clientes"
    className="inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-slate-500 transition hover:text-slate-900"
  >
    <ArrowLeft className="size-4" aria-hidden="true" />
    Clientes
  </Link>
);

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const customer = useCustomer(id);
  const { uid } = useCurrentUser();
  const { showToast } = useToast();
  const router = useRouter();
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);

  useLayoutEffect(
    () => () => {
      setEditing(null);
      setDeleting(null);
    },
    [],
  );

  if (customer.status === "loading") return <CustomerDetailSkeleton />;
  if (customer.status === "error") {
    return (
      <>
        <div className="mb-6">{backLink}</div>
        <ErrorState
          title="No se ha podido cargar el cliente"
          message={dataErrorMessage(customer.error)}
          onRetry={customer.retry}
        />
      </>
    );
  }
  if (!customer.data) {
    return (
      <>
        <div className="mb-6">{backLink}</div>
        <EmptyState
          icon={UserX}
          title="Este cliente no existe"
          description="Puede que se haya borrado o que el enlace no sea correcto."
          action={
            <Link href="/clientes" className={buttonClassName("secondary")}>
              Ver todos los clientes
            </Link>
          }
        />
      </>
    );
  }

  const c = customer.data;
  return (
    <>
      <div className="mb-4">{backLink}</div>
      <PageHeader
        title={c.name}
        description={`Cliente desde el ${formatDate(c.createdAt)}`}
        actions={
          <>
            <Button type="button" variant="secondary" onClick={() => setEditing(c)}>
              <Pencil className="size-4" aria-hidden="true" />
              Editar
            </Button>
            <Button type="button" variant="secondary" onClick={() => setDeleting(c)}>
              <Trash2 className="size-4 text-rose-600" aria-hidden="true" />
              Borrar
            </Button>
          </>
        }
      />

      <div className="space-y-8">
        <section aria-label="Datos del cliente" className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            <DetailItem label="NIF / CIF / NIE">
              {c.taxId && <span className="font-mono">{c.taxId}</span>}
            </DetailItem>
            <DetailItem label="Email">
              {c.email && (
                <a href={`mailto:${c.email}`} className="text-emerald-700 hover:underline">
                  {c.email}
                </a>
              )}
            </DetailItem>
            <DetailItem label="Teléfono">
              {c.phone && (
                <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="text-emerald-700 hover:underline">
                  {c.phone}
                </a>
              )}
            </DetailItem>
            <DetailItem label="Dirección">{c.address}</DetailItem>
            <DetailItem label="Notas" wide>
              {c.notes && <span className="whitespace-pre-line">{c.notes}</span>}
            </DetailItem>
          </dl>
        </section>

        <CustomerInvoices customerId={c.id} />
      </div>

      {editing && <CustomerFormDrawer customer={editing} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDialog
          title={`¿Borrar a ${deleting.name}?`}
          confirmLabel="Borrar cliente"
          errorMessage={dataErrorMessage}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await deleteCustomer(uid, deleting.id);
            showToast("Cliente borrado");
            router.replace("/clientes");
          }}
        >
          <p>Se borrará de tu lista de clientes. Esta acción no se puede deshacer.</p>
          <p>Las facturas que ya le hayas emitido no se borran: conservan su nombre y su NIF.</p>
        </ConfirmDialog>
      )}
    </>
  );
}

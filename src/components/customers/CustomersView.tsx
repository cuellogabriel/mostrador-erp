"use client";

import { Pencil, Plus, SearchX, Trash2, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { useLayoutEffect, useMemo, useState } from "react";
import { useCustomers } from "@/hooks/useCustomers";
import { dataErrorMessage } from "@/lib/dataErrors";
import { deleteCustomer } from "@/lib/db/customers";
import { matchesQuery } from "@/lib/search";
import type { Customer } from "@/lib/types";
import { useCurrentUser } from "../AuthProvider";
import { Button } from "../Button";
import { ConfirmDialog } from "../ConfirmDialog";
import { DataTable, type Column } from "../DataTable";
import { EmptyState } from "../EmptyState";
import { ErrorState } from "../ErrorState";
import { IconButton } from "../IconButton";
import { PageHeader } from "../PageHeader";
import { SearchInput } from "../SearchInput";
import { TableSkeleton } from "../TableSkeleton";
import { useToast } from "../ToastProvider";
import { CustomerFormDrawer } from "./CustomerFormDrawer";

const muted = <span className="text-slate-500">—</span>;

export function CustomersView() {
  const { uid } = useCurrentUser();
  const { showToast } = useToast();
  const customers = useCustomers();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Customer | "new" | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);

  // Al salir de la página (Next la deja oculta, no la desmonta) se cierran los diálogos.
  useLayoutEffect(
    () => () => {
      setEditing(null);
      setDeleting(null);
    },
    [],
  );

  const filtered = useMemo(
    () =>
      customers.status === "ready"
        ? customers.data.filter((c) => matchesQuery([c.name, c.taxId, c.email, c.phone], query))
        : [],
    [customers, query],
  );

  const actions = (customer: Customer) => (
    <div className="flex justify-end gap-1">
      <IconButton icon={Pencil} label={`Editar ${customer.name}`} onClick={() => setEditing(customer)} />
      <IconButton icon={Trash2} label={`Borrar ${customer.name}`} tone="danger" onClick={() => setDeleting(customer)} />
    </div>
  );

  const columns: Column<Customer>[] = [
    {
      id: "name",
      header: "Cliente",
      cell: (c) => (
        <Link href={`/clientes/${c.id}`} className="font-medium text-slate-900 hover:text-emerald-700 hover:underline">
          {c.name}
        </Link>
      ),
    },
    { id: "taxId", header: "NIF / CIF", cell: (c) => (c.taxId ? <span className="font-mono text-[13px]">{c.taxId}</span> : muted) },
    { id: "email", header: "Email", cell: (c) => c.email ?? muted, className: "max-w-64 truncate" },
    { id: "phone", header: "Teléfono", cell: (c) => c.phone ?? muted, className: "whitespace-nowrap" },
    { id: "actions", header: "Acciones", srOnlyHeader: true, align: "right", cell: actions },
  ];

  function renderContent() {
    if (customers.status === "loading") return <TableSkeleton label="Cargando clientes…" />;
    if (customers.status === "error") {
      return (
        <ErrorState
          title="No se han podido cargar los clientes"
          message={dataErrorMessage(customers.error)}
          onRetry={customers.retry}
        />
      );
    }
    if (customers.data.length === 0) {
      return (
        <EmptyState
          icon={Users}
          title="Aún no tienes clientes"
          description="Da de alta a tu primer cliente para poder hacerle facturas."
          action={
            <Button type="button" onClick={() => setEditing("new")}>
              <UserPlus className="size-4" aria-hidden="true" />
              Añadir el primer cliente
            </Button>
          }
        />
      );
    }
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput
            label="Buscar clientes"
            placeholder="Buscar por nombre, NIF o email"
            value={query}
            onChange={setQuery}
            className="sm:max-w-sm sm:flex-1"
          />
          <p className="text-sm text-slate-500" aria-live="polite">
            {query
              ? `${filtered.length} de ${customers.data.length} clientes`
              : `${customers.data.length} ${customers.data.length === 1 ? "cliente" : "clientes"}`}
          </p>
        </div>
        {filtered.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Ningún cliente coincide"
            description={`No hay clientes que coincidan con «${query.trim()}». Prueba con otro nombre, NIF o email.`}
            action={
              <Button type="button" variant="secondary" onClick={() => setQuery("")}>
                Limpiar búsqueda
              </Button>
            }
          />
        ) : (
          <DataTable
            caption="Clientes"
            columns={columns}
            rows={filtered}
            rowKey={(c) => c.id}
            mobileCard={(c) => (
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <Link href={`/clientes/${c.id}`} className="font-medium text-slate-900 hover:text-emerald-700">
                    {c.name}
                  </Link>
                  <p className="mt-0.5 truncate text-sm text-slate-500">
                    {[c.taxId, c.email ?? c.phone].filter(Boolean).join(" · ") || "Sin datos de contacto"}
                  </p>
                </div>
                {actions(c)}
              </div>
            )}
          />
        )}
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Las personas y empresas a las que facturas."
        actions={
          <Button type="button" onClick={() => setEditing("new")}>
            <Plus className="size-4" aria-hidden="true" />
            Nuevo cliente
          </Button>
        }
      />
      {renderContent()}

      {editing && (
        <CustomerFormDrawer customer={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />
      )}
      {deleting && (
        <ConfirmDialog
          title={`¿Borrar a ${deleting.name}?`}
          confirmLabel="Borrar cliente"
          errorMessage={dataErrorMessage}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await deleteCustomer(uid, deleting.id);
            setDeleting(null);
            showToast("Cliente borrado");
          }}
        >
          <p>Se borrará de tu lista de clientes. Esta acción no se puede deshacer.</p>
          <p>Las facturas que ya le hayas emitido no se borran: conservan su nombre y su NIF.</p>
        </ConfirmDialog>
      )}
    </>
  );
}

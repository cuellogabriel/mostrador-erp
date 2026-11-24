"use client";

import { Package, PackagePlus, Pencil, Plus, SearchX, Trash2 } from "lucide-react";
import { useLayoutEffect, useMemo, useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { dataErrorMessage } from "@/lib/dataErrors";
import { deleteProduct } from "@/lib/db/products";
import { formatEUR } from "@/lib/money";
import { matchesQuery } from "@/lib/search";
import { needsRestock } from "@/lib/stock";
import type { Product } from "@/lib/types";
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
import { ProductFormDrawer } from "./ProductFormDrawer";
import { StockBadge } from "./StockBadge";
import { StockStepper } from "./StockStepper";

export function ProductsView() {
  const { uid } = useCurrentUser();
  const { showToast } = useToast();
  const products = useProducts();
  const [query, setQuery] = useState("");
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  // Al salir de la página (Next la deja oculta, no la desmonta) se cierran los diálogos.
  useLayoutEffect(
    () => () => {
      setEditing(null);
      setDeleting(null);
    },
    [],
  );

  const all = useMemo(() => (products.status === "ready" ? products.data : []), [products]);
  // Se busca en los datos en vivo: el panel de edición muestra siempre el stock actual.
  const editingProduct = editing && editing !== "new" ? all.find((p) => p.id === editing) : undefined;
  const lowStockCount = useMemo(() => all.filter(needsRestock).length, [all]);
  const filtered = useMemo(
    () => all.filter((p) => (!onlyLowStock || needsRestock(p)) && matchesQuery([p.name, p.sku], query)),
    [all, onlyLowStock, query],
  );

  const actions = (product: Product) => (
    <div className="flex justify-end gap-1">
      <IconButton icon={Pencil} label={`Editar ${product.name}`} onClick={() => setEditing(product.id)} />
      <IconButton icon={Trash2} label={`Borrar ${product.name}`} tone="danger" onClick={() => setDeleting(product)} />
    </div>
  );

  const columns: Column<Product>[] = [
    {
      id: "name",
      header: "Producto",
      cell: (p) => (
        <div className="min-w-40">
          <p className="font-medium text-slate-900">{p.name}</p>
          {p.sku && <p className="mt-0.5 font-mono text-xs text-slate-500">{p.sku}</p>}
        </div>
      ),
    },
    {
      id: "price",
      header: "Precio sin IVA",
      align: "right",
      cell: (p) => <span className="whitespace-nowrap tabular-nums">{formatEUR(p.priceCents)}</span>,
    },
    { id: "vat", header: "IVA", align: "right", cell: (p) => <span className="whitespace-nowrap">{p.vatRate} %</span> },
    {
      id: "stock",
      header: "Stock",
      cell: (p) => (
        <div className="flex items-center gap-2">
          <StockStepper product={p} />
          <StockBadge stock={p.stock} minStock={p.minStock} />
        </div>
      ),
    },
    { id: "min", header: "Mínimo", align: "right", cell: (p) => <span className="tabular-nums">{p.minStock}</span> },
    { id: "actions", header: "Acciones", srOnlyHeader: true, align: "right", cell: actions },
  ];

  function renderContent() {
    if (products.status === "loading") return <TableSkeleton label="Cargando productos…" />;
    if (products.status === "error") {
      return (
        <ErrorState
          title="No se han podido cargar los productos"
          message={dataErrorMessage(products.error)}
          onRetry={products.retry}
        />
      );
    }
    if (all.length === 0) {
      return (
        <EmptyState
          icon={Package}
          title="Aún no tienes productos"
          description="Añade lo que vendes con su precio, su IVA y el stock que tienes."
          action={
            <Button type="button" onClick={() => setEditing("new")}>
              <PackagePlus className="size-4" aria-hidden="true" />
              Añadir el primer producto
            </Button>
          }
        />
      );
    }

    const filtering = query.trim() !== "" || onlyLowStock;
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            label="Buscar productos"
            placeholder="Buscar por nombre o SKU"
            value={query}
            onChange={setQuery}
            className="sm:max-w-sm sm:flex-1"
          />
          <label className="inline-flex h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm transition select-none hover:border-slate-300 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-600">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={onlyLowStock}
              onChange={(e) => setOnlyLowStock(e.target.checked)}
            />
            <span
              aria-hidden="true"
              className="relative h-5 w-9 rounded-full bg-slate-300 transition after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-white after:shadow after:transition peer-checked:bg-emerald-700 peer-checked:after:translate-x-4"
            />
            Solo stock bajo
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200 ring-inset">
              {lowStockCount}
            </span>
          </label>
          <p className="text-sm text-slate-500 sm:ml-auto" aria-live="polite">
            {filtering
              ? `${filtered.length} de ${all.length} productos`
              : `${all.length} ${all.length === 1 ? "producto" : "productos"}`}
          </p>
        </div>
        {filtered.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title={onlyLowStock && !query.trim() ? "Todo el stock está en orden" : "Ningún producto coincide"}
            description={
              onlyLowStock && !query.trim()
                ? "No tienes productos agotados ni por debajo de su stock mínimo."
                : "Prueba con otro nombre o SKU, o quita el filtro de stock bajo."
            }
            action={
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setQuery("");
                  setOnlyLowStock(false);
                }}
              >
                Ver todos los productos
              </Button>
            }
          />
        ) : (
          <DataTable
            caption="Productos"
            columns={columns}
            rows={filtered}
            rowKey={(p) => p.id}
            mobileCard={(p) => (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">{p.name}</p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      <span className="tabular-nums">{formatEUR(p.priceCents)}</span> sin IVA · IVA {p.vatRate} %
                      {p.sku && <span className="font-mono"> · {p.sku}</span>}
                    </p>
                  </div>
                  {actions(p)}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StockStepper product={p} />
                  <StockBadge stock={p.stock} minStock={p.minStock} />
                  <span className="text-xs text-slate-500">Mínimo {p.minStock}</span>
                </div>
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
        title="Productos"
        description="Tu catálogo con precios, IVA y stock."
        actions={
          <Button type="button" onClick={() => setEditing("new")}>
            <Plus className="size-4" aria-hidden="true" />
            Nuevo producto
          </Button>
        }
      />
      {renderContent()}

      {editing === "new" && <ProductFormDrawer onClose={() => setEditing(null)} />}
      {editingProduct && <ProductFormDrawer product={editingProduct} onClose={() => setEditing(null)} />}
      {deleting && (
        <ConfirmDialog
          title={`¿Borrar «${deleting.name}»?`}
          confirmLabel="Borrar producto"
          errorMessage={dataErrorMessage}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await deleteProduct(uid, deleting.id);
            setDeleting(null);
            showToast("Producto borrado");
          }}
        >
          <p>Desaparecerá de tu catálogo y no podrás añadirlo a facturas nuevas. Esta acción no se puede deshacer.</p>
          <p>Las facturas ya emitidas no cambian: conservan su propia copia del nombre, el precio y el IVA.</p>
        </ConfirmDialog>
      )}
    </>
  );
}

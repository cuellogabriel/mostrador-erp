"use client";

import { useId, useState, type FormEvent } from "react";
import { dataErrorMessage } from "@/lib/dataErrors";
import { createProduct, updateProduct } from "@/lib/db/products";
import { calcLine } from "@/lib/invoice";
import { formatEUR, toCents } from "@/lib/money";
import {
  EMPTY_PRODUCT_FORM,
  parseVatRate,
  productToForm,
  validateProductForm,
  type ProductField,
  type ProductFormValues,
} from "@/lib/productForm";
import type { Product } from "@/lib/types";
import type { FieldErrors } from "@/lib/validation";
import { useCurrentUser } from "../AuthProvider";
import { Button } from "../Button";
import { Drawer } from "../Drawer";
import { FormAlert } from "../FormAlert";
import { SelectField } from "../SelectField";
import { TextField } from "../TextField";
import { useToast } from "../ToastProvider";
import { StockStepper } from "./StockStepper";

const VAT_OPTIONS = [
  { value: "21", label: "21 % · General" },
  { value: "10", label: "10 % · Reducido" },
  { value: "4", label: "4 % · Superreducido" },
  { value: "0", label: "0 % · Exento" },
] as const;

interface ProductFormDrawerProps {
  /** Producto a editar; sin él, se da de alta uno nuevo. */
  product?: Product;
  onClose: () => void;
}

/** Precio con IVA de una unidad, si el precio y el tipo escritos son válidos. */
function priceWithVat(values: ProductFormValues): string | null {
  const cents = toCents(values.price);
  const vatRate = parseVatRate(values.vatRate);
  if (cents === null || cents < 0 || vatRate === null) return null;
  return formatEUR(calcLine({ quantity: 1, unitPriceCents: cents, vatRate, discountPct: 0 }).totalCents);
}

export function ProductFormDrawer({ product, onClose }: ProductFormDrawerProps) {
  const { uid } = useCurrentUser();
  const { showToast } = useToast();
  const formId = useId();
  const [values, setValues] = useState<ProductFormValues>(() => (product ? productToForm(product) : EMPTY_PRODUCT_FORM));
  const [errors, setErrors] = useState<FieldErrors<ProductField>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function field(name: ProductField) {
    return {
      name,
      value: values[name],
      error: errors[name],
      onChange: (event: { target: { value: string } }) => {
        const { value } = event.target;
        setValues((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      },
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateProductForm(values);
    setFormError(null);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      if (product) {
        // El stock no se reescribe al editar: solo cambia con +/− o con las facturas (D10).
        const { name, sku, priceCents, vatRate, minStock } = result.data;
        await updateProduct(uid, product.id, { name, sku, priceCents, vatRate, minStock });
      } else {
        await createProduct(uid, result.data);
      }
      showToast(product ? "Producto guardado" : "Producto creado");
      onClose();
    } catch (error) {
      setFormError(dataErrorMessage(error));
      setSaving(false);
    }
  }

  const withVat = priceWithVat(values);

  return (
    <Drawer
      title={product ? "Editar producto" : "Nuevo producto"}
      description={product ? product.name : "Los campos con * son obligatorios."}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            {product ? "Guardar cambios" : "Crear producto"}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-5">
        {formError && <FormAlert message={formError} />}
        <TextField label="Nombre" required autoComplete="off" data-autofocus {...field("name")} />
        <TextField
          label="SKU o referencia"
          autoComplete="off"
          hint="Código interno o de barras. Opcional."
          className="[&_input]:font-mono"
          {...field("sku")}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Precio sin IVA"
            required
            inputMode="decimal"
            autoComplete="off"
            placeholder="12,50"
            trailing={<span className="px-3 text-sm text-slate-500">€</span>}
            {...field("price")}
          />
          <SelectField label="IVA" options={VAT_OPTIONS} {...field("vatRate")} />
        </div>
        <p className="-mt-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600" aria-live="polite">
          Precio con IVA:{" "}
          <span className="font-semibold text-slate-900 tabular-nums">{withVat ?? "—"}</span>
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          {product ? (
            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">Stock actual</p>
              <StockStepper product={product} />
              <p className="mt-1.5 text-xs text-slate-500">Se guarda al momento. Las facturas lo descuentan solas.</p>
            </div>
          ) : (
            <TextField label="Stock inicial" required inputMode="numeric" autoComplete="off" {...field("stock")} />
          )}
          <TextField
            label="Stock mínimo"
            required
            inputMode="numeric"
            autoComplete="off"
            hint="Te avisamos cuando quede esta cantidad o menos."
            {...field("minStock")}
          />
        </div>
      </form>
    </Drawer>
  );
}

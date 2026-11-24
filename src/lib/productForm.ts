import { centsToInput, toCents } from "./money";
import { VAT_RATES, type Product, type ProductInput, type VatRate } from "./types";
import { hasErrors, type FieldErrors } from "./validation";

export interface ProductFormValues {
  name: string;
  sku: string;
  /** Precio sin IVA tal y como lo escribe el usuario, en euros ("12,50"). */
  price: string;
  vatRate: string;
  stock: string;
  minStock: string;
}

export type ProductField = keyof ProductFormValues;

export const EMPTY_PRODUCT_FORM: ProductFormValues = {
  name: "",
  sku: "",
  price: "",
  vatRate: "21",
  stock: "0",
  minStock: "0",
};

export const PRODUCT_LIMITS = { name: 200, sku: 64 } as const;

/** Mayor cantidad que se admite en stock (suficiente y lejos de los límites de los enteros). */
export const MAX_STOCK = 1_000_000_000;

export type ProductValidation =
  | { ok: true; data: ProductInput }
  | { ok: false; errors: FieldErrors<ProductField> };

/** Convierte el texto de un input en entero ≥ 0, o `null` si no lo es. */
export function parseNonNegativeInt(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const n = Number(trimmed);
  return n <= MAX_STOCK ? n : null;
}

export function parseVatRate(value: string): VatRate | null {
  return VAT_RATES.find((rate) => String(rate) === value.trim()) ?? null;
}

/** Valida el formulario y devuelve los datos limpios (precio en céntimos) listos para guardar. */
export function validateProductForm(values: ProductFormValues): ProductValidation {
  const errors: FieldErrors<ProductField> = {};
  const name = values.name.trim();
  const sku = values.sku.trim();

  if (!name) errors.name = "Escribe el nombre del producto.";
  else if (name.length > PRODUCT_LIMITS.name)
    errors.name = `El nombre no puede pasar de ${PRODUCT_LIMITS.name} caracteres.`;

  if (sku.length > PRODUCT_LIMITS.sku) errors.sku = `El SKU no puede pasar de ${PRODUCT_LIMITS.sku} caracteres.`;

  const priceCents = values.price.trim() ? toCents(values.price) : null;
  if (!values.price.trim()) errors.price = "Escribe el precio sin IVA, por ejemplo 12,50.";
  else if (priceCents === null) errors.price = "Escribe un precio válido con hasta 2 decimales, por ejemplo 12,50.";
  else if (priceCents < 0) errors.price = "El precio no puede ser negativo.";

  const vatRate = parseVatRate(values.vatRate);
  if (vatRate === null) errors.vatRate = "Elige un tipo de IVA: 21 %, 10 %, 4 % o 0 %.";

  const stock = parseNonNegativeInt(values.stock);
  if (stock === null) errors.stock = "El stock tiene que ser un número entero igual o mayor que 0.";

  const minStock = parseNonNegativeInt(values.minStock);
  if (minStock === null) errors.minStock = "El stock mínimo tiene que ser un número entero igual o mayor que 0.";

  if (hasErrors(errors) || priceCents === null || vatRate === null || stock === null || minStock === null) {
    return { ok: false, errors };
  }

  const data: ProductInput = { name, priceCents, vatRate, stock, minStock };
  if (sku) data.sku = sku;
  return { ok: true, data };
}

/** Valores del formulario a partir de un producto existente (para editarlo). */
export function productToForm(product: Product): ProductFormValues {
  return {
    name: product.name,
    sku: product.sku ?? "",
    price: centsToInput(product.priceCents),
    vatRate: String(product.vatRate),
    stock: String(product.stock),
    minStock: String(product.minStock),
  };
}

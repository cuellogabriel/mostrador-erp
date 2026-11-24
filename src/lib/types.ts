export type VatRate = 21 | 10 | 4 | 0;

export const VAT_RATES: readonly VatRate[] = [21, 10, 4, 0];

export type InvoiceStatus = "pending" | "paid" | "void";

export interface Customer {
  id: string;
  name: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  createdAt: Date;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  priceCents: number;
  vatRate: VatRate;
  stock: number;
  minStock: number;
  createdAt: Date;
}

export interface InvoiceLine {
  productId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  vatRate: VatRate;
  discountPct: number;
}

export interface VatBreakdownEntry {
  rate: VatRate;
  baseCents: number;
  vatCents: number;
}

export interface Invoice {
  id: string;
  number: string;
  year: number;
  seq: number;
  customerId: string;
  customerName: string;
  customerTaxId?: string;
  lines: InvoiceLine[];
  baseCents: number;
  vatCents: number;
  totalCents: number;
  vatBreakdown: VatBreakdownEntry[];
  status: InvoiceStatus;
  issuedAt: Date;
  paidAt?: Date;
}

/** Documento `users/{uid}/meta/counters`: claves `invoices_<año>` con el último número usado. */
export type InvoiceCounters = Record<`invoices_${number}`, number>;

/** Datos editables de un cliente (lo que se guarda, sin id ni fecha de alta). */
export type CustomerInput = Omit<Customer, "id" | "createdAt">;

/** Datos editables de un producto (lo que se guarda, sin id ni fecha de alta). */
export type ProductInput = Omit<Product, "id" | "createdAt">;

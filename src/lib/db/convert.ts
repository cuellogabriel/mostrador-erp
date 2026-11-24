import { Timestamp, type DocumentSnapshot } from "firebase/firestore";
import {
  VAT_RATES,
  type BusinessProfile,
  type Customer,
  type Invoice,
  type InvoiceLine,
  type InvoiceStatus,
  type Product,
  type VatBreakdownEntry,
  type VatRate,
} from "@/lib/types";

/**
 * Único sitio donde los documentos de Firestore se convierten a los tipos de la app.
 * Los campos se leen como `unknown` y se estrechan; un dato corrupto nunca rompe la interfaz.
 */
type Fields = Record<string, unknown>;

function fieldsOf(snapshot: DocumentSnapshot): Fields {
  // "estimate": mientras se confirma una escritura, serverTimestamp() se ve como la hora local.
  return snapshot.data({ serverTimestamps: "estimate" }) ?? {};
}

function readString(fields: Fields, key: string): string {
  const value = fields[key];
  return typeof value === "string" ? value : "";
}

function readOptionalString(fields: Fields, key: string): string | undefined {
  const value = fields[key];
  return typeof value === "string" && value !== "" ? value : undefined;
}

function readInt(fields: Fields, key: string): number {
  const value = fields[key];
  return typeof value === "number" && Number.isInteger(value) ? value : 0;
}

function readNumber(fields: Fields, key: string): number {
  const value = fields[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readVatRate(fields: Fields, key: string): VatRate {
  const value = fields[key];
  return VAT_RATES.find((rate) => rate === value) ?? 21;
}

function isFields(value: unknown): value is Fields {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readList(fields: Fields, key: string): Fields[] {
  const value = fields[key];
  return Array.isArray(value) ? value.filter(isFields) : [];
}

const STATUSES: readonly InvoiceStatus[] = ["pending", "paid", "void"];

function readStatus(fields: Fields, key: string): InvoiceStatus {
  const value = fields[key];
  return STATUSES.find((status) => status === value) ?? "pending";
}

function readDate(value: unknown): Date {
  return value instanceof Timestamp ? value.toDate() : new Date(0);
}

function readOptionalDate(value: unknown): Date | undefined {
  return value instanceof Timestamp ? value.toDate() : undefined;
}

export function customerFromSnapshot(snapshot: DocumentSnapshot): Customer {
  const fields = fieldsOf(snapshot);
  return {
    id: snapshot.id,
    name: readString(fields, "name"),
    taxId: readOptionalString(fields, "taxId"),
    email: readOptionalString(fields, "email"),
    phone: readOptionalString(fields, "phone"),
    address: readOptionalString(fields, "address"),
    notes: readOptionalString(fields, "notes"),
    createdAt: readDate(fields.createdAt),
  };
}

export function productFromSnapshot(snapshot: DocumentSnapshot): Product {
  const fields = fieldsOf(snapshot);
  return {
    id: snapshot.id,
    name: readString(fields, "name"),
    sku: readOptionalString(fields, "sku"),
    priceCents: readInt(fields, "priceCents"),
    vatRate: readVatRate(fields, "vatRate"),
    stock: readInt(fields, "stock"),
    minStock: readInt(fields, "minStock"),
    createdAt: readDate(fields.createdAt),
  };
}

function lineFromFields(fields: Fields): InvoiceLine {
  return {
    productId: readString(fields, "productId"),
    name: readString(fields, "name"),
    quantity: readInt(fields, "quantity"),
    unitPriceCents: readInt(fields, "unitPriceCents"),
    vatRate: readVatRate(fields, "vatRate"),
    discountPct: readNumber(fields, "discountPct"),
  };
}

function breakdownFromFields(fields: Fields): VatBreakdownEntry {
  return {
    rate: readVatRate(fields, "rate"),
    baseCents: readInt(fields, "baseCents"),
    vatCents: readInt(fields, "vatCents"),
  };
}

function businessFromFields(fields: Fields): BusinessProfile {
  return {
    name: readString(fields, "name"),
    taxId: readString(fields, "taxId"),
    address: readString(fields, "address"),
    email: readOptionalString(fields, "email"),
    phone: readOptionalString(fields, "phone"),
  };
}

/** Datos del emisor (`null` si aún no se han configurado). */
export function businessFromSnapshot(snapshot: DocumentSnapshot): BusinessProfile | null {
  return snapshot.exists() ? businessFromFields(fieldsOf(snapshot)) : null;
}

export function invoiceFromSnapshot(snapshot: DocumentSnapshot): Invoice {
  const fields = fieldsOf(snapshot);
  const issuer = fields.issuer;
  return {
    id: snapshot.id,
    number: readString(fields, "number"),
    year: readInt(fields, "year"),
    seq: readInt(fields, "seq"),
    customerId: readString(fields, "customerId"),
    customerName: readString(fields, "customerName"),
    customerTaxId: readOptionalString(fields, "customerTaxId"),
    issuer: isFields(issuer) ? businessFromFields(issuer) : undefined,
    lines: readList(fields, "lines").map(lineFromFields),
    baseCents: readInt(fields, "baseCents"),
    vatCents: readInt(fields, "vatCents"),
    totalCents: readInt(fields, "totalCents"),
    vatBreakdown: readList(fields, "vatBreakdown").map(breakdownFromFields),
    status: readStatus(fields, "status"),
    issuedAt: readDate(fields.issuedAt),
    paidAt: readOptionalDate(fields.paidAt),
  };
}

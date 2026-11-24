import { validateSpanishTaxId } from "./taxId";
import type { Customer, CustomerInput } from "./types";
import { hasErrors, isValidEmail, type FieldErrors } from "./validation";

export interface CustomerFormValues {
  name: string;
  taxId: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}

export type CustomerField = keyof CustomerFormValues;

export const EMPTY_CUSTOMER_FORM: CustomerFormValues = {
  name: "",
  taxId: "",
  email: "",
  phone: "",
  address: "",
  notes: "",
};

/** Límites de longitud (los mismos que exige firestore.rules). */
export const CUSTOMER_LIMITS = {
  name: 200,
  email: 254,
  phone: 30,
  address: 500,
  notes: 2000,
} as const;

const PHONE_PATTERN = /^\+?[\d\s().-]+$/;

export type CustomerValidation =
  | { ok: true; data: CustomerInput }
  | { ok: false; errors: FieldErrors<CustomerField> };

/** Valida el formulario y devuelve los datos limpios listos para guardar. */
export function validateCustomerForm(values: CustomerFormValues): CustomerValidation {
  const errors: FieldErrors<CustomerField> = {};
  const name = values.name.trim();
  const taxIdRaw = values.taxId.trim();
  const email = values.email.trim();
  const phone = values.phone.trim();
  const address = values.address.trim();
  const notes = values.notes.trim();

  if (!name) errors.name = "Escribe el nombre o la razón social.";
  else if (name.length > CUSTOMER_LIMITS.name)
    errors.name = `El nombre no puede pasar de ${CUSTOMER_LIMITS.name} caracteres.`;

  let taxId: string | undefined;
  if (taxIdRaw) {
    const result = validateSpanishTaxId(taxIdRaw);
    if (result.valid) taxId = result.normalized;
    else errors.taxId = "El NIF, NIE o CIF no es válido. Revisa la letra o el dígito de control.";
  }

  if (email && !isValidEmail(email)) errors.email = "Escribe un email válido, por ejemplo ana@empresa.es.";
  else if (email.length > CUSTOMER_LIMITS.email) errors.email = "El email es demasiado largo.";

  const phoneDigits = phone.replace(/\D/g, "").length;
  if (phone && (!PHONE_PATTERN.test(phone) || phoneDigits < 6 || phone.length > CUSTOMER_LIMITS.phone))
    errors.phone = "Escribe un teléfono válido, por ejemplo 612 345 678.";

  if (address.length > CUSTOMER_LIMITS.address)
    errors.address = `La dirección no puede pasar de ${CUSTOMER_LIMITS.address} caracteres.`;
  if (notes.length > CUSTOMER_LIMITS.notes)
    errors.notes = `Las notas no pueden pasar de ${CUSTOMER_LIMITS.notes} caracteres.`;

  if (hasErrors(errors)) return { ok: false, errors };

  const data: CustomerInput = { name };
  if (taxId) data.taxId = taxId;
  if (email) data.email = email;
  if (phone) data.phone = phone;
  if (address) data.address = address;
  if (notes) data.notes = notes;
  return { ok: true, data };
}

/** Valores del formulario a partir de un cliente existente (para editarlo). */
export function customerToForm(customer: Customer): CustomerFormValues {
  return {
    name: customer.name,
    taxId: customer.taxId ?? "",
    email: customer.email ?? "",
    phone: customer.phone ?? "",
    address: customer.address ?? "",
    notes: customer.notes ?? "",
  };
}

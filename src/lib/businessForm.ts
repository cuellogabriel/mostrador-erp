import { validateSpanishTaxId } from "./taxId";
import type { BusinessProfile } from "./types";
import { hasErrors, isValidEmail, type FieldErrors } from "./validation";

export interface BusinessFormValues {
  name: string;
  taxId: string;
  address: string;
  email: string;
  phone: string;
}

export type BusinessField = keyof BusinessFormValues;

export const EMPTY_BUSINESS_FORM: BusinessFormValues = { name: "", taxId: "", address: "", email: "", phone: "" };

const PHONE_PATTERN = /^\+?[\d\s().-]+$/;

export type BusinessValidation =
  | { ok: true; data: BusinessProfile }
  | { ok: false; errors: FieldErrors<BusinessField> };

/** Valida los datos del emisor. Nombre, NIF/CIF y dirección son obligatorios en una factura. */
export function validateBusinessForm(values: BusinessFormValues): BusinessValidation {
  const errors: FieldErrors<BusinessField> = {};
  const name = values.name.trim();
  const address = values.address.trim();
  const email = values.email.trim();
  const phone = values.phone.trim();

  if (!name) errors.name = "Escribe el nombre o la razón social de tu empresa.";
  else if (name.length > 200) errors.name = "El nombre no puede pasar de 200 caracteres.";

  let taxId = "";
  if (!values.taxId.trim()) errors.taxId = "Escribe el NIF o CIF de tu empresa.";
  else {
    const result = validateSpanishTaxId(values.taxId);
    if (result.valid) taxId = result.normalized;
    else errors.taxId = "El NIF, NIE o CIF no es válido. Revisa la letra o el dígito de control.";
  }

  if (!address) errors.address = "Escribe la dirección fiscal.";
  else if (address.length > 500) errors.address = "La dirección no puede pasar de 500 caracteres.";

  if (email && (!isValidEmail(email) || email.length > 254))
    errors.email = "Escribe un email válido, por ejemplo hola@tuempresa.es.";

  if (phone && (!PHONE_PATTERN.test(phone) || phone.replace(/\D/g, "").length < 6 || phone.length > 30))
    errors.phone = "Escribe un teléfono válido, por ejemplo 912 345 678.";

  if (hasErrors(errors)) return { ok: false, errors };
  const data: BusinessProfile = { name, taxId, address };
  if (email) data.email = email;
  if (phone) data.phone = phone;
  return { ok: true, data };
}

export function businessToForm(profile: BusinessProfile | null): BusinessFormValues {
  if (!profile) return EMPTY_BUSINESS_FORM;
  return {
    name: profile.name,
    taxId: profile.taxId,
    address: profile.address,
    email: profile.email ?? "",
    phone: profile.phone ?? "",
  };
}

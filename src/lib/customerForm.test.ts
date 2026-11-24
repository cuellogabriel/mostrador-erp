import { describe, expect, it } from "vitest";
import { customerToForm, EMPTY_CUSTOMER_FORM, validateCustomerForm, type CustomerFormValues } from "@/lib/customerForm";

const form = (overrides: Partial<CustomerFormValues> = {}): CustomerFormValues => ({
  ...EMPTY_CUSTOMER_FORM,
  name: "Ferretería López",
  ...overrides,
});

describe("validateCustomerForm", () => {
  it("con solo el nombre guarda solo el nombre (sin campos vacíos)", () => {
    expect(validateCustomerForm(form({ name: "  Ferretería López  " }))).toEqual({
      ok: true,
      data: { name: "Ferretería López" },
    });
  });

  it("exige el nombre", () => {
    const result = validateCustomerForm(form({ name: "   " }));
    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors.name).toBe("Escribe el nombre o la razón social.");
  });

  it("limita la longitud del nombre", () => {
    const result = validateCustomerForm(form({ name: "a".repeat(201) }));
    expect(!result.ok && result.errors.name).toMatch(/200/);
    expect(validateCustomerForm(form({ name: "a".repeat(200) })).ok).toBe(true);
  });

  it("guarda el NIF/CIF/NIE normalizado", () => {
    const result = validateCustomerForm(form({ taxId: " b-1234567 4 " }));
    expect(result).toEqual({ ok: true, data: { name: "Ferretería López", taxId: "B12345674" } });
  });

  it("rechaza un NIF con la letra incorrecta", () => {
    const result = validateCustomerForm(form({ taxId: "12345678A" }));
    expect(!result.ok && result.errors.taxId).toMatch(/no es válido/);
  });

  it("valida el email solo si se informa", () => {
    expect(validateCustomerForm(form({ email: "" })).ok).toBe(true);
    const bad = validateCustomerForm(form({ email: "ana@empresa" }));
    expect(!bad.ok && bad.errors.email).toMatch(/email válido/);
    const tooLong = validateCustomerForm(form({ email: `${"a".repeat(250)}@x.es` }));
    expect(!tooLong.ok && tooLong.errors.email).toMatch(/largo/);
  });

  it("valida el teléfono", () => {
    expect(validateCustomerForm(form({ phone: "+34 612 345 678" })).ok).toBe(true);
    expect(validateCustomerForm(form({ phone: "(91) 123-45-67" })).ok).toBe(true);
    for (const phone of ["12345", "abc 123 456", "6".repeat(31)]) {
      const result = validateCustomerForm(form({ phone }));
      expect(!result.ok && result.errors.phone).toMatch(/teléfono válido/);
    }
  });

  it("limita dirección y notas", () => {
    const result = validateCustomerForm(form({ address: "a".repeat(501), notes: "a".repeat(2001) }));
    expect(!result.ok && result.errors.address).toMatch(/500/);
    expect(!result.ok && result.errors.notes).toMatch(/2000/);
  });

  it("devuelve todos los errores a la vez", () => {
    const result = validateCustomerForm({ ...EMPTY_CUSTOMER_FORM, taxId: "X", email: "x", phone: "1" });
    expect(!result.ok && Object.keys(result.errors).sort()).toEqual(["email", "name", "phone", "taxId"]);
  });

  it("guarda todos los campos informados recortados", () => {
    const result = validateCustomerForm({
      name: " Ana ",
      taxId: "12345678z",
      email: " ana@empresa.es ",
      phone: " 612345678 ",
      address: " C/ Mayor 1 ",
      notes: " Paga a 30 días ",
    });
    expect(result).toEqual({
      ok: true,
      data: {
        name: "Ana",
        taxId: "12345678Z",
        email: "ana@empresa.es",
        phone: "612345678",
        address: "C/ Mayor 1",
        notes: "Paga a 30 días",
      },
    });
  });
});

describe("customerToForm", () => {
  it("rellena con texto vacío los campos que faltan", () => {
    expect(customerToForm({ id: "1", name: "Ana", email: "ana@empresa.es", createdAt: new Date(2026, 0, 1) })).toEqual({
      ...EMPTY_CUSTOMER_FORM,
      name: "Ana",
      email: "ana@empresa.es",
    });
  });
});

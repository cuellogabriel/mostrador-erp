import { describe, expect, it } from "vitest";
import { businessToForm, EMPTY_BUSINESS_FORM, validateBusinessForm, type BusinessFormValues } from "@/lib/businessForm";

const form = (overrides: Partial<BusinessFormValues> = {}): BusinessFormValues => ({
  name: "Ferretería Ejemplo S.L.",
  taxId: "b-12345674",
  address: "Calle Mayor 1, 28013 Madrid",
  email: "",
  phone: "",
  ...overrides,
});

describe("validateBusinessForm", () => {
  it("guarda los obligatorios recortados y el CIF normalizado, sin opcionales vacíos", () => {
    expect(validateBusinessForm(form({ name: "  Ferretería Ejemplo S.L. " }))).toEqual({
      ok: true,
      data: { name: "Ferretería Ejemplo S.L.", taxId: "B12345674", address: "Calle Mayor 1, 28013 Madrid" },
    });
  });

  it("incluye email y teléfono si se informan", () => {
    const result = validateBusinessForm(form({ email: " hola@ejemplo.es ", phone: "+34 912 345 678" }));
    expect(result.ok && result.data).toMatchObject({ email: "hola@ejemplo.es", phone: "+34 912 345 678" });
  });

  it("exige nombre, NIF/CIF y dirección", () => {
    const result = validateBusinessForm(EMPTY_BUSINESS_FORM);
    expect(!result.ok && Object.keys(result.errors).sort()).toEqual(["address", "name", "taxId"]);
  });

  it("rechaza un CIF con el control incorrecto", () => {
    const result = validateBusinessForm(form({ taxId: "B12345675" }));
    expect(!result.ok && result.errors.taxId).toMatch(/no es válido/);
  });

  it("rechaza email, teléfono y longitudes no válidos", () => {
    const result = validateBusinessForm(
      form({ email: "hola@", phone: "12", name: "a".repeat(201), address: "a".repeat(501) }),
    );
    expect(!result.ok && Object.keys(result.errors).sort()).toEqual(["address", "email", "name", "phone"]);
  });
});

describe("businessToForm", () => {
  it("devuelve el formulario vacío si no hay datos", () => {
    expect(businessToForm(null)).toEqual(EMPTY_BUSINESS_FORM);
  });

  it("rellena con texto vacío los opcionales que faltan", () => {
    expect(businessToForm({ name: "A", taxId: "B12345674", address: "C/ 1" })).toEqual({
      name: "A",
      taxId: "B12345674",
      address: "C/ 1",
      email: "",
      phone: "",
    });
  });
});

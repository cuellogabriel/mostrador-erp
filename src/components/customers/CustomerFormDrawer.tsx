"use client";

import { useId, useState, type FormEvent } from "react";
import {
  customerToForm,
  EMPTY_CUSTOMER_FORM,
  validateCustomerForm,
  type CustomerField,
  type CustomerFormValues,
} from "@/lib/customerForm";
import { dataErrorMessage } from "@/lib/dataErrors";
import { createCustomer, updateCustomer } from "@/lib/db/customers";
import type { Customer } from "@/lib/types";
import type { FieldErrors } from "@/lib/validation";
import { useCurrentUser } from "../AuthProvider";
import { Button } from "../Button";
import { Drawer } from "../Drawer";
import { FormAlert } from "../FormAlert";
import { TextAreaField } from "../TextAreaField";
import { TextField } from "../TextField";
import { useToast } from "../ToastProvider";

interface CustomerFormDrawerProps {
  /** Cliente a editar; sin él, se da de alta uno nuevo. */
  customer?: Customer;
  onClose: () => void;
}

export function CustomerFormDrawer({ customer, onClose }: CustomerFormDrawerProps) {
  const { uid } = useCurrentUser();
  const { showToast } = useToast();
  const formId = useId();
  const [values, setValues] = useState<CustomerFormValues>(() =>
    customer ? customerToForm(customer) : EMPTY_CUSTOMER_FORM,
  );
  const [errors, setErrors] = useState<FieldErrors<CustomerField>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function field(name: CustomerField) {
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
    const result = validateCustomerForm(values);
    setFormError(null);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      if (customer) await updateCustomer(uid, customer.id, result.data);
      else await createCustomer(uid, result.data);
      showToast(customer ? "Cliente guardado" : "Cliente creado");
      onClose();
    } catch (error) {
      setFormError(dataErrorMessage(error));
      setSaving(false);
    }
  }

  return (
    <Drawer
      title={customer ? "Editar cliente" : "Nuevo cliente"}
      description={customer ? customer.name : "Los campos con * son obligatorios."}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            {customer ? "Guardar cambios" : "Crear cliente"}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="space-y-5">
        {formError && <FormAlert message={formError} />}
        <TextField label="Nombre o razón social" required autoComplete="organization" data-autofocus {...field("name")} />
        <TextField
          label="NIF, CIF o NIE"
          autoComplete="off"
          placeholder="B12345674"
          hint="Comprobamos la letra o el dígito de control."
          className="[&_input]:uppercase"
          {...field("taxId")}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Email" type="email" inputMode="email" autoComplete="email" {...field("email")} />
          <TextField label="Teléfono" type="tel" inputMode="tel" autoComplete="tel" {...field("phone")} />
        </div>
        <TextField label="Dirección" autoComplete="street-address" {...field("address")} />
        <TextAreaField label="Notas" rows={3} placeholder="Condiciones de pago, persona de contacto…" {...field("notes")} />
      </form>
    </Drawer>
  );
}

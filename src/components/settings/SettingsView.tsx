"use client";

import { Building2, Info } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useBusiness } from "@/hooks/useBusiness";
import {
  businessToForm,
  validateBusinessForm,
  type BusinessField,
  type BusinessFormValues,
} from "@/lib/businessForm";
import { dataErrorMessage } from "@/lib/dataErrors";
import { saveBusiness } from "@/lib/db/business";
import type { BusinessProfile } from "@/lib/types";
import type { FieldErrors } from "@/lib/validation";
import { useCurrentUser } from "../AuthProvider";
import { Button } from "../Button";
import { ErrorState } from "../ErrorState";
import { FormAlert } from "../FormAlert";
import { PageHeader } from "../PageHeader";
import { TableSkeleton } from "../TableSkeleton";
import { TextField } from "../TextField";
import { useToast } from "../ToastProvider";

function BusinessForm({ profile }: { profile: BusinessProfile | null }) {
  const { uid } = useCurrentUser();
  const { showToast } = useToast();
  const [values, setValues] = useState<BusinessFormValues>(() => businessToForm(profile));
  const [errors, setErrors] = useState<FieldErrors<BusinessField>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function field(name: BusinessField) {
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
    setFormError(null);
    const result = validateBusinessForm(values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await saveBusiness(uid, result.data);
      setValues(businessToForm(result.data));
      showToast("Datos de la empresa guardados");
    } catch (error) {
      setFormError(dataErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {formError && <FormAlert message={formError} />}
      <TextField label="Nombre o razón social" required autoComplete="organization" {...field("name")} />
      <TextField
        label="NIF o CIF"
        required
        autoComplete="off"
        placeholder="B12345674"
        className="[&_input]:uppercase"
        {...field("taxId")}
      />
      <TextField label="Dirección fiscal" required autoComplete="street-address" {...field("address")} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Email" type="email" inputMode="email" autoComplete="email" {...field("email")} />
        <TextField label="Teléfono" type="tel" inputMode="tel" autoComplete="tel" {...field("phone")} />
      </div>
      <div className="flex justify-end border-t border-slate-100 pt-5">
        <Button type="submit" loading={saving}>
          Guardar datos
        </Button>
      </div>
    </form>
  );
}

export function SettingsView() {
  const business = useBusiness();

  return (
    <>
      <PageHeader title="Ajustes" description="Los datos de tu empresa que aparecen en las facturas." />
      {business.status === "loading" && <TableSkeleton label="Cargando los datos de tu empresa…" rows={4} />}
      {business.status === "error" && (
        <ErrorState
          title="No se han podido cargar los datos de tu empresa"
          message={dataErrorMessage(business.error)}
          onRetry={business.retry}
        />
      )}
      {business.status === "ready" && (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section
            aria-labelledby="business-title"
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"
          >
            <h2 id="business-title" className="mb-1 flex items-center gap-2 text-base font-semibold text-slate-900">
              <Building2 className="size-5 text-emerald-700" aria-hidden="true" />
              Datos del emisor
            </h2>
            <p className="mb-6 text-sm text-slate-500">
              {business.data
                ? "Los cambios se aplican a las facturas que emitas a partir de ahora."
                : "Aún no has configurado tu empresa. Complétalo antes de emitir facturas."}
            </p>
            <BusinessForm profile={business.data} />
          </section>
          <aside className="flex gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-5 text-sm text-slate-600">
            <Info className="mt-0.5 size-4 shrink-0 text-slate-500" aria-hidden="true" />
            <p>
              Cada factura guarda una copia de estos datos al emitirse, igual que hace con el cliente. Si los cambias
              después, las facturas ya emitidas no cambian.
            </p>
          </aside>
        </div>
      )}
    </>
  );
}

import { Building2 } from "lucide-react";
import Link from "next/link";

/** Aviso de que faltan los datos del emisor, con enlace a Ajustes. */
export function IssuerNotice() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:flex-row sm:items-center print:hidden">
      <Building2 className="size-5 shrink-0 text-amber-700" aria-hidden="true" />
      <p className="flex-1">
        <span className="font-medium">Faltan los datos de tu empresa.</span> Una factura necesita el nombre, el NIF y
        la dirección del emisor.
      </p>
      <Link
        href="/ajustes"
        className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-white px-3 font-medium text-amber-900 ring-1 ring-amber-300 transition hover:bg-amber-100"
      >
        Completar en Ajustes
      </Link>
    </div>
  );
}

"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import { dataErrorMessage } from "@/lib/dataErrors";
import { seedDemoData } from "@/lib/db/seed";
import { useCurrentUser } from "../AuthProvider";
import { Button } from "../Button";
import { FormAlert } from "../FormAlert";
import { useToast } from "../ToastProvider";

/** Carga los datos de ejemplo mostrando el progreso. */
export function SeedDataButton() {
  const { uid } = useCurrentUser();
  const { showToast } = useToast();
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    setProgress({ done: 0, total: 1 });
    try {
      const invoices = await seedDemoData(uid, (done, total) => setProgress({ done, total }));
      showToast(`Datos de ejemplo cargados: ${invoices} facturas, clientes y productos`);
    } catch (failure) {
      setError(dataErrorMessage(failure));
    } finally {
      setProgress(null);
    }
  }

  const percent = progress ? Math.round((progress.done / progress.total) * 100) : 0;
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <Button type="button" onClick={handleClick} loading={progress !== null}>
        {progress === null && <Sparkles className="size-4" aria-hidden="true" />}
        {progress ? "Cargando datos…" : "Cargar datos de ejemplo"}
      </Button>
      {progress && (
        <div className="w-full">
          <div
            role="progressbar"
            aria-label="Progreso de la carga de datos de ejemplo"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200"
          >
            <div className="h-full rounded-full bg-emerald-600 transition-[width]" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-1.5 text-center text-xs text-slate-500">
            Creando clientes, productos y facturas… {percent} %
          </p>
        </div>
      )}
      {error && <FormAlert message={error} />}
    </div>
  );
}

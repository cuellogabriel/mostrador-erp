"use client";

import { TriangleAlert } from "lucide-react";
import { useId, useRef, useState, type ReactNode } from "react";
import { Button } from "./Button";
import { FormAlert } from "./FormAlert";
import { useModal } from "./useModal";

interface ConfirmDialogProps {
  title: string;
  /** Explicación de lo que va a pasar. */
  children: ReactNode;
  confirmLabel: string;
  /** Acción a confirmar; si falla, el diálogo muestra `errorMessage(error)` y sigue abierto. */
  onConfirm: () => Promise<void>;
  onClose: () => void;
  errorMessage: (error: unknown) => string;
}

/** Diálogo de confirmación para acciones destructivas. Se monta solo cuando está abierto. */
export function ConfirmDialog({ title, children, confirmLabel, onConfirm, onClose, errorMessage }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const bodyId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useModal(dialogRef, () => {
    if (!busy) onClose();
  });

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (failure) {
      setError(errorMessage(failure));
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        aria-hidden="true"
        className="absolute inset-0 animate-fade-in bg-slate-900/40 backdrop-blur-[2px]"
        onClick={busy ? undefined : onClose}
      />
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        tabIndex={-1}
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl shadow-slate-900/20 motion-safe:animate-pop-in"
      >
        <div className="flex gap-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-rose-50 text-rose-600 ring-1 ring-rose-100">
            <TriangleAlert className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-slate-900">
              {title}
            </h2>
            <div id={bodyId} className="mt-1.5 space-y-2 text-sm text-slate-600">
              {children}
            </div>
          </div>
        </div>
        {error && (
          <div className="mt-4">
            <FormAlert message={error} />
          </div>
        )}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy} data-autofocus>
            Cancelar
          </Button>
          <Button type="button" variant="danger" onClick={handleConfirm} loading={busy}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

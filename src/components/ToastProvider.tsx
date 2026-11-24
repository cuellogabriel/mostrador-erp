"use client";

import { CircleAlert, CircleCheck, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type ToastTone = "success" | "error";

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  /** Muestra un aviso breve ("Cliente guardado") que desaparece solo. */
  showToast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);
const TOAST_DURATION_MS = 4000;

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const Icon = toast.tone === "success" ? CircleCheck : CircleAlert;
  return (
    <li className="pointer-events-auto flex w-full items-center gap-3 rounded-xl bg-slate-900 py-3 pr-2 pl-4 text-sm text-white shadow-lg shadow-slate-900/20 motion-safe:animate-toast-in sm:w-auto sm:min-w-72">
      <Icon
        className={`size-5 shrink-0 ${toast.tone === "success" ? "text-emerald-400" : "text-rose-400"}`}
        aria-hidden="true"
      />
      <p className="flex-1">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Cerrar aviso"
        className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </li>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);
  const showToast = useCallback((message: string, tone: ToastTone = "success") => {
    setToasts((list) => [...list.slice(-2), { id: Date.now() + Math.random(), message, tone }]);
  }, []);
  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] print:hidden flex justify-center px-4 lg:right-6 lg:bottom-6 lg:left-auto lg:justify-end"
      >
        <ul className="flex w-full flex-col items-center gap-2 sm:w-auto lg:items-end">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </ul>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return context;
}

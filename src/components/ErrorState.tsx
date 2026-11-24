import { CircleAlert, RefreshCw } from "lucide-react";
import { Button } from "./Button";

interface ErrorStateProps {
  title: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center rounded-2xl border border-rose-200 bg-rose-50/60 px-6 py-12 text-center"
    >
      <span className="grid size-12 place-items-center rounded-2xl bg-white text-rose-600 ring-1 ring-rose-200">
        <CircleAlert className="size-6" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-base font-semibold text-slate-900">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-slate-600">{message}</p>
      {onRetry && (
        <Button type="button" variant="secondary" className="mt-6" onClick={onRetry}>
          <RefreshCw className="size-4" aria-hidden="true" />
          Reintentar
        </Button>
      )}
    </div>
  );
}

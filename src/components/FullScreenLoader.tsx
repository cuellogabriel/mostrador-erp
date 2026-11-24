import { LoaderCircle } from "lucide-react";

export function FullScreenLoader({ label }: { label: string }) {
  return (
    <div role="status" className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-slate-50 text-slate-500">
      <LoaderCircle className="size-6 animate-spin text-emerald-600" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

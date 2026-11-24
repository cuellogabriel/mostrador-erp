/** Esqueleto de carga para listas (tabla en escritorio, tarjetas en móvil). */
export function TableSkeleton({ label, rows = 5 }: { label: string; rows?: number }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm"
    >
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="h-11 border-b border-slate-100 bg-slate-50/70" />
      <ul aria-hidden="true" className="divide-y divide-slate-100">
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="flex items-center gap-4 px-5 py-4">
            <div className="h-3.5 w-1/3 animate-pulse rounded-full bg-slate-200/80" />
            <div className="hidden h-3.5 w-1/5 animate-pulse rounded-full bg-slate-100 sm:block" />
            <div className="ml-auto h-3.5 w-16 animate-pulse rounded-full bg-slate-100" />
          </li>
        ))}
      </ul>
    </div>
  );
}

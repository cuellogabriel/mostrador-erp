export function CustomerDetailSkeleton() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Cargando cliente…</span>
      <div aria-hidden="true" className="animate-pulse">
        <div className="h-4 w-20 rounded-full bg-slate-200/80" />
        <div className="mt-5 h-8 w-64 max-w-full rounded-full bg-slate-200/80" />
        <div className="mt-3 h-4 w-40 rounded-full bg-slate-100" />
        <div className="mt-8 grid gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-16 rounded-full bg-slate-100" />
              <div className="h-4 w-40 max-w-full rounded-full bg-slate-200/80" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

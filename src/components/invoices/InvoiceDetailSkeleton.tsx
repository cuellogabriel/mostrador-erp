export function InvoiceDetailSkeleton() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Cargando factura…</span>
      <div aria-hidden="true" className="animate-pulse">
        <div className="h-4 w-20 rounded-full bg-slate-200/80" />
        <div className="mt-5 flex flex-wrap gap-2">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-11 w-32 rounded-xl bg-slate-200/70" />
          ))}
        </div>
        <div className="mx-auto mt-6 max-w-[210mm] space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-10">
          <div className="flex justify-between">
            <div className="h-9 w-36 rounded-xl bg-slate-200/80" />
            <div className="h-9 w-40 rounded-xl bg-slate-200/80" />
          </div>
          <div className="h-4 w-48 rounded-full bg-slate-100" />
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-4 w-full rounded-full bg-slate-100" />
          ))}
          <div className="ml-auto h-8 w-48 rounded-xl bg-slate-200/80" />
        </div>
      </div>
    </div>
  );
}

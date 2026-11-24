import { FileText, LayoutDashboard, Package, Settings, Users } from "lucide-react";

const BARS = [38, 52, 46, 64, 58, 82];
const MONTHS = ["jun", "jul", "ago", "sept", "oct", "nov"];

/** Maqueta de la app hecha solo con HTML y CSS (decorativa). */
export function ProductMockup() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-xl select-none">
      <div className="absolute -inset-6 rounded-[2rem] bg-linear-to-br from-emerald-200/60 via-teal-100/40 to-transparent blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
        <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-rose-300" />
          <span className="size-2.5 rounded-full bg-amber-300" />
          <span className="size-2.5 rounded-full bg-emerald-300" />
          <span className="ml-3 h-5 flex-1 rounded-md bg-white ring-1 ring-slate-200" />
        </div>
        <div className="flex">
          <div className="hidden w-36 shrink-0 space-y-1 border-r border-slate-100 p-3 sm:block">
            {[LayoutDashboard, FileText, Users, Package, Settings].map((Icon, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${i === 0 ? "bg-emerald-50 ring-1 ring-emerald-100" : ""}`}
              >
                <Icon className={`size-3.5 ${i === 0 ? "text-emerald-600" : "text-slate-300"}`} />
                <span className={`h-2 rounded-full ${i === 0 ? "w-12 bg-emerald-300" : "w-14 bg-slate-200"}`} />
              </div>
            ))}
          </div>
          <div className="min-w-0 flex-1 space-y-3 p-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                ["Este mes", "4.812 €"],
                ["Pendiente", "1.270 €"],
                ["Stock bajo", "3"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-100 p-2.5">
                  <p className="text-[10px] text-slate-500">{label}</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900 tabular-nums">{value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-slate-100 p-3">
              <p className="text-[10px] font-medium text-slate-500">Facturación · últimos 6 meses</p>
              <div className="mt-2 flex h-28 items-end gap-2.5">
                {BARS.map((height, i) => (
                  <div key={MONTHS[i]} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className={`w-full max-w-7 rounded-t ${i === BARS.length - 1 ? "bg-emerald-600" : "bg-emerald-500/70"}`}
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-[9px] text-slate-500">{MONTHS[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -right-2 -bottom-8 w-52 rotate-2 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xl shadow-slate-900/10 sm:-right-8">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] font-semibold text-slate-900">F-2026-0042</span>
          <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium text-emerald-800 ring-1 ring-emerald-200">
            Pagada
          </span>
        </div>
        <div className="mt-2.5 space-y-1.5">
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Base imponible</span>
            <span className="tabular-nums">350,00 €</span>
          </div>
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>IVA 21 %</span>
            <span className="tabular-nums">73,50 €</span>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-1.5 text-xs font-semibold text-slate-900">
            <span>Total</span>
            <span className="tabular-nums">423,50 €</span>
          </div>
        </div>
      </div>
    </div>
  );
}

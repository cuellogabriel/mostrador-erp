"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { MonthBucket } from "@/lib/dashboard";
import { formatCompactEUR, formatEUR } from "@/lib/money";

const BAR = "#059669"; // emerald-600: ≥ 3:1 sobre blanco (marca gráfica)
const GRID = "#e2e8f0"; // slate-200
const AXIS_TEXT = "#64748b"; // slate-500

/** Facturación de los últimos meses (una serie: sin leyenda, el título la nombra). */
export function RevenueChart({ data }: { data: readonly MonthBucket[] }) {
  const rows = data.map((month) => ({ label: month.label, cents: month.totalCents }));

  return (
    <>
      <div aria-hidden="true" className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: 4 }} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="0" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: AXIS_TEXT, fontSize: 12 }} dy={6} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={64}
              tick={{ fill: AXIS_TEXT, fontSize: 12 }}
              tickFormatter={(value: number) => formatCompactEUR(value)}
            />
            <Tooltip
              cursor={{ fill: "rgb(148 163 184 / 0.12)" }}
              content={({ active, label }) => {
                const month = active ? data.find((m) => m.label === label) : undefined;
                if (!month) return null;
                return (
                  <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg shadow-slate-900/10">
                    <p className="text-xs text-slate-500 first-letter:uppercase">{month.longLabel}</p>
                    <p className="font-semibold text-slate-900 tabular-nums">{formatEUR(month.totalCents)}</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="cents" fill={BAR} radius={[4, 4, 0, 0]} maxBarSize={44} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>Facturación de los últimos {data.length} meses, sin facturas anuladas</caption>
        <thead>
          <tr>
            <th scope="col">Mes</th>
            <th scope="col">Facturado</th>
          </tr>
        </thead>
        <tbody>
          {data.map((month) => (
            <tr key={month.key}>
              <th scope="row">{month.longLabel}</th>
              <td>{formatEUR(month.totalCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

import type { ReactNode } from "react";

export interface Column<T> {
  /** Identificador único de la columna. */
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
  /** Oculta el texto de la cabecera (sigue disponible para lectores de pantalla). */
  srOnlyHeader?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  caption: string;
  columns: readonly Column<T>[];
  rows: readonly T[];
  rowKey: (row: T) => string;
  /** Cómo se ve cada fila en móvil (tarjeta). */
  mobileCard: (row: T) => ReactNode;
}

const ALIGN = { left: "text-left", right: "text-right", center: "text-center" } as const;

/**
 * Tabla en escritorio y lista de tarjetas en móvil (D13).
 * Si la tabla no cabe, hace scroll dentro de su contenedor, nunca en la página.
 */
export function DataTable<T>({ caption, columns, rows, rowKey, mobileCard }: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70">
              {columns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className={`px-4 py-3 text-xs font-medium tracking-wide whitespace-nowrap text-slate-500 uppercase first:pl-5 last:pr-5 ${
                    ALIGN[column.align ?? "left"]
                  }`}
                >
                  <span className={column.srOnlyHeader ? "sr-only" : undefined}>{column.header}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={rowKey(row)} className="transition hover:bg-slate-50/70">
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={`px-4 py-3 align-middle text-slate-700 first:pl-5 last:pr-5 ${ALIGN[column.align ?? "left"]} ${
                      column.className ?? ""
                    }`}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-slate-100 md:hidden" aria-label={caption}>
        {rows.map((row) => (
          <li key={rowKey(row)} className="p-4">
            {mobileCard(row)}
          </li>
        ))}
      </ul>
    </div>
  );
}

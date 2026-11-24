const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** Fecha en formato español `dd/mm/aaaa`. */
export function formatDate(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Fecha no válida");
  }
  return dateFormatter.format(date);
}

const longDateFormatter = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** Fecha larga en español: "martes, 24 de noviembre de 2026". */
export function formatLongDate(date: Date): string {
  if (Number.isNaN(date.getTime())) throw new RangeError("Fecha no válida");
  return longDateFormatter.format(date);
}

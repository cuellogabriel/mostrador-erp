const collator = new Intl.Collator("es", { sensitivity: "base", numeric: true });

/** Minúsculas y sin tildes, para buscar sin importar cómo se escribió. */
export function normalizeText(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function compact(value: string): string {
  return value.replace(/[\s./-]/g, "");
}

/**
 * `true` si todas las palabras de la búsqueda aparecen en alguno de los campos.
 * Una búsqueda vacía lo acepta todo.
 */
export function matchesQuery(fields: readonly (string | undefined)[], query: string): boolean {
  const words = normalizeText(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = fields
    .filter((field): field is string => Boolean(field))
    .map(normalizeText)
    .join(" ");
  // Versión sin separadores para encontrar "B-1234 5674" en "B12345674".
  const compactHaystack = compact(haystack);
  return words.every((word) => haystack.includes(word) || compactHaystack.includes(compact(word)));
}

/** Orden alfabético en español (sin distinguir mayúsculas ni tildes). */
export function compareText(a: string, b: string): number {
  return collator.compare(a, b);
}

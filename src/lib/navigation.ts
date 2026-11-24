/** Indica si `href` es la sección actual: coincide exacto o es un subnivel (`/clientes/abc`). */
export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

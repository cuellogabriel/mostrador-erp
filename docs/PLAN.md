# Plan · Mostrador

Mini-ERP para pymes: clientes, productos con stock, facturas con IVA y un panel con lo importante del negocio.
Orquesta: `CLAUDE.md` · Programa: `develop` · Revisa: `testing` (DIRECTRICES D1–D14).

Estado: ⬜ pendiente · 🔄 en curso · ✅ aprobada por testing (con nº de review)

| ID | Tarea | Estado | Review |
|---|---|---|---|
| T1 | Base: Firebase, login, zona privada, reglas | ⬜ | |
| T2 | Lógica pura: dinero, IVA, totales, NIF/CIF/NIE, numeración | ⬜ | |
| T3 | Clientes | ⬜ | |
| T4 | Productos y stock | ⬜ | |
| T5 | Facturas | ⬜ | |
| T6 | Panel | ⬜ | |
| T7 | Paleta de comandos y portada | ⬜ | |
| T8 | Datos de demo y README | ⬜ | |

---

## T1 · Base
- Script `npm run check` = `tsc --noEmit && eslint && vitest run && next build`; `npm test` = `vitest run`.
- `src/lib/firebase.ts`: inicializa app, `auth` y `db` desde `NEXT_PUBLIC_FIREBASE_*`.
- Contexto de sesión (`AuthProvider` + `useAuth`).
- `/login` y `/registro` (email + contraseña) con errores de Firebase traducidos al español. En `/login`, botón **"Entrar con la cuenta demo"** que rellena `demo@mostrador.app`.
- Grupo `(app)` con guard: sin sesión → `/login` sin mostrar nada privado (D7). Layout con barra lateral (escritorio) y barra inferior (móvil): Panel, Facturas, Clientes, Productos. Botón salir.
- `firestore.rules` según D6.
- Quitar restos de la plantilla. `lang="es"`, metadatos de Mostrador.

## T2 · Lógica pura (`src/lib`) con tests
- `money.ts`: `toCents("12,50")`, `formatEUR(1250)` → `12,50 €`.
- `invoice.ts`: `calcLine`, `calcInvoice(lines)` → base, IVA desglosado por tipo, total; descuento % por línea; redondeo al céntimo por línea.
- `taxId.ts`: `validateSpanishTaxId` (NIF, NIE, CIF) con letra/dígito de control.
- `numbering.ts`: `formatInvoiceNumber(2026, 7)` → `F-2026-0007`.
- `dates.ts`: `formatDate` → `dd/mm/aaaa`.

## T3 · Clientes
- Lista con búsqueda (nombre, NIF, email), alta/edición en panel lateral o modal, borrado con confirmación.
- Campos: nombre*, NIF/CIF/NIE, email, teléfono, dirección, notas. Validación D8.
- Ficha con sus facturas y total facturado.

## T4 · Productos y stock
- Lista con búsqueda, SKU, precio (sin IVA), tipo de IVA (21/10/4/0), stock, stock mínimo.
- Indicador de stock bajo (≤ mínimo) y agotado. Ajuste rápido de stock (+/−).

## T5 · Facturas
- Nueva factura: cliente, líneas (producto → precio e IVA por defecto, cantidad, descuento %), totales en vivo con `calcInvoice`.
- Guardado en **transacción** (D10): número correlativo por año, descuento de stock, error claro si no hay stock.
- Lista con filtros por estado (pendiente, pagada, anulada) y búsqueda.
- Detalle imprimible (A4, `window.print`), marcar como pagada, anular (repone stock), enviar por WhatsApp (`wa.me` con resumen y total).

## T6 · Panel
- KPIs: facturado este mes, pendiente de cobro, nº clientes, productos con stock bajo.
- Gráfico de facturación de los últimos 6 meses (Recharts).
- Últimas 5 facturas y lista de stock bajo.
- Si no hay datos: estado vacío con botón **"Cargar datos de ejemplo"**.

## T7 · Paleta de comandos y portada
- `Ctrl/⌘ + K`: buscar clientes, productos, facturas y acciones (nueva factura, nuevo cliente…).
- Portada pública `/` que explica la app y lleva al login.

## T8 · Datos de demo y README
- `src/lib/db/seed.ts`: crea clientes, productos y facturas de ejemplo para el usuario actual.
- `README.md`: qué es, cómo se trabajó con los 3 agentes, cómo recrearlo (Firebase + Vercel paso a paso), usuario demo.

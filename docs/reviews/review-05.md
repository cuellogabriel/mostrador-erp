# Review 05 · T9 Ajustes del emisor, T6 Panel, T8 Datos de demo y README, T7 Paleta y portada
Veredicto T9 (Ajustes del emisor): APROBADO
Veredicto T6 (Panel): APROBADO
Veredicto T8 (Datos de demo y README): RECHAZADO
Veredicto T7 (Paleta Ctrl+K y portada): RECHAZADO
Comprobaciones: npm run check → OK (tsc sin errores, eslint sin warnings, vitest 19 ficheros / 263 tests en verde, next build OK)
Pruebas contra Firebase real: cuenta de pruebas propia creada con `accounts:signUp` (no la demo) y un test de Vitest temporal fuera del repo que importa el código real (`src/lib/db/seed.ts`, `invoices.ts`, `convert.ts`, `src/lib/dashboard.ts`…). 6/6 escenarios con el resultado esperado. Al terminar, cuenta borrada con `accounts:delete` (HTTP 200; el login posterior da `INVALID_LOGIN_CREDENTIALS`).

## Fallos

### T8
- [D10] src/lib/db/seed.ts:21 — `seedDemoData` solo se niega si hay **clientes o productos**, no si ya hay **facturas** este año. En una cuenta que tiene facturas pero ya no tiene clientes ni productos, el panel muestra el estado vacío con «Cargar datos de ejemplo» (`PanelView.tsx:119`, misma condición). El seed sigue entonces la numeración existente con fechas de junio, y la serie deja de ir en orden cronológico (en España la numeración tiene que seguir a las fechas). Es justo el estado en que quedó la cuenta demo tras review-03/04 (0 clientes, 0 productos, facturas `F-2026-0001…0007`).
  - Reproducido en vivo: cuenta con `F-2026-0001…0020` (la última, del 24/11/2026) → borrar clientes y productos → «Cargar datos de ejemplo» → crea `F-2026-0021` **del 04/06/2026**, y así hasta la 0038.
  - Corrección: que `seedDemoData` (y la condición del estado vacío del panel) exija también que no haya facturas, o que el contador del año esté a 0, y lance `SeedNotEmptyError` en ese caso. Recomendable además que las reglas exijan `issuedAt` ≥ la fecha de la última factura del año (por ejemplo, guardando la última fecha en el contador), porque hoy aceptan cualquier fecha pasada del año.

### T7
- [D14] src/components/CommandPalette.tsx + src/components/useModal.ts:26-31 — `Ctrl/⌘ + K` abre la paleta aunque ya haya otro modal abierto. Al pulsar **Esc**, los dos `useModal` (escuchan `keydown` en `document`) cierran a la vez la paleta y el modal de debajo, y se pierde lo escrito.
  - Reproducir: Clientes › «Nuevo cliente» → escribir el nombre → `Ctrl+K` → `Esc`. Se cierran la paleta y el panel del cliente, y el borrador desaparece.
  - Corrección: no abrir la paleta si hay un modal abierto, o que `useModal` mantenga una pila y solo el modal de arriba atienda Esc y Tab.
- [D14] src/components/CommandPalette.tsx:187-189 — `headingId = \`${listId}-${group.title}\`` mete espacios en el id del grupo «Ir a». `aria-labelledby="…-Ir a"` se interpreta como dos ids que no existen, así que ese grupo se queda sin nombre accesible. Corrección: usar un id sin espacios (por ejemplo, el índice o un slug).
- [D14] src/components/CommandPalette.tsx:219-223 — el aviso «No hay resultados…» (`<p role="status">`) está **dentro** del `role="listbox"`, que solo admite `option` o `group`. Un validador ARIA (axe, `aria-required-children`) lo marca. Corrección: sacarlo fuera del listbox (y dejar el listbox vacío u ocultarlo).

## Pruebas contra el servidor
- **Seed real** (`seedDemoData`): **48,2 s**, progreso 39/39.
  - Emisor igual a `seedPlan.business`, 8 clientes, 12 productos, 18 facturas con ids `F-2026-0001…0018`.
  - `issuedAt` estrictamente creciente con el número, del 04/06/2026 al 22/11/2026.
  - El stock final de cada producto es igual a `plan.finalStock`: 1 agotado (Cinta métrica) y 2 bajo mínimo (Brocas: 4 de 6; Guantes: 20 de 20).
  - Estados igual que el plan: 10 pagadas, todas con `paidAt` posterior a `issuedAt`; 6 pendientes y 2 anuladas, ninguna con `paidAt`.
  - Las 18 facturas llevan la copia `issuer`. OK
- **Segundo seed** → `SeedNotEmptyError`. OK
- **Agregados del panel** sobre lo sembrado (leído con `invoiceFromSnapshot`):
  - La suma de los 6 meses (jun 145,21 € … nov 553,09 €) es igual a la suma de las facturas no anuladas.
  - Pendiente 1.629,90 € = suma de las pendientes; cobrado 1.048,55 € = suma de las pagadas; facturado = pendiente + cobrado.
  - Este mes 553,09 € frente a 364,21 € (+52 %), que coincide con los dos últimos meses del gráfico.
  - `lowStockProducts` = 3, con el agotado primero. Coherente y sin anuladas. OK
- **Emitir desde la app** (`createInvoice` con `serverTimestamp`): `F-2026-0019` guarda `issuer` completo (nombre, NIF B86421351, dirección, email, teléfono). OK
- **Reglas**:
  - Permitido (controles positivos): `issuedAt` hace 1 h y `paidAt` hace 1 min.
  - Denegado (`permission-denied`): `issuedAt` en el futuro, `issuedAt` del año anterior y `paidAt` en el futuro.
  - Denegado en `meta/business`: sin NIF, NIF vacío, campo de más, escribir y leer el de otro uid, y factura con `issuer` inválido. OK

## Observaciones (no bloquean)
- Seed en enero–mayo: `buildSeedPlan` descarta las fechas del año anterior, así que a principios de año habrá pocas facturas de ejemplo y el gráfico de 6 meses saldrá casi vacío. Es coherente con las reglas, pero conviene saberlo antes de grabar la demo.
- Si el seed se corta a medias (red, cerrar la pestaña), quedan datos parciales y el reintento da `SeedNotEmptyError`.
- Portada: «Gratis y de código abierto», pero el repositorio no tiene `LICENSE`. Sin licencia no es código abierto. Añadir una licencia o cambiar el texto.
- `seedPlan` usa NIF/CIF y teléfonos con formato válido para empresas y personas ficticias. Podrían coincidir con identificadores reales. Si se quiere evitar del todo, usar prefijos o rangos claramente de ejemplo.

## Verificado
- D1 `npm run check` en verde. OK
- D2 sin `any`, `@ts-ignore` ni `as unknown as`. `businessFromSnapshot` y el `issuer` de la factura se convierten en `convert.ts`. Ningún componente ni hook importa `firebase/firestore`. OK
- D3 tests de las funciones nuevas (`dashboard`, `seedPlan`, `businessForm`, `formatLongDate`, `formatCompactEUR`, `SeedNotEmptyError`). OK
- D4 sin `console.log`, TODO ni código muerto. OK
- D5 `git grep AIza` solo encuentra menciones en texto (`testing.md` y reviews), ninguna clave. `.env.local` sigue ignorado (`.gitignore:34 .env*`). OK
- D6 `meta/business` solo para su `uid` y validado (comprobado en vivo). OK
- D7 `/ajustes` dentro de `(app)`. La paleta solo se monta con sesión. OK
- D8 Ajustes: nombre, NIF/CIF (con control) y dirección obligatorios; email y teléfono validados; errores junto al campo. OK
- D9 agregados en céntimos; gráfico y KPIs con `formatEUR`/`formatCompactEUR`. OK
- D10 emisor copiado dentro de la misma transacción de emisión. Reglas de fechas comprobadas. OK salvo el fallo de T8
- D11 fechas largas, meses y textos en español de España. OK
- D12 Panel: esqueleto, error con reintentar, vacío con «Cargar datos de ejemplo» y progreso, secciones vacías con acción. Ajustes: carga, error y formulario vacío con aviso. Aviso de emisor que falta en el panel y en «Nueva factura». OK
- D13 portada a 360 px: cabecera con logo + «Entrar», hero de una columna, la maqueta y su tarjeta flotante dentro de una sección con `overflow-hidden` (no hay scroll horizontal), y CTA y pie apilados. Panel con KPIs en 1 columna y gráfico responsive. OK
- D14 portada: contrastes ≥ 4,5:1 en el texto (slate-600/500 sobre blanco, emerald-800 sobre emerald-50, slate-300 sobre slate-950). La maqueta es `aria-hidden` y decorativa. Enlaces externos con «(se abre en una ventana nueva)». **Sin imágenes externas**: no hay ninguna `<img>`; maqueta en HTML/CSS e iconos SVG en línea. Gráfico `aria-hidden` con tabla equivalente `sr-only`. Barra de progreso con `role="progressbar"` y valores. Paleta: patrón combobox correcto (`role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, opciones con `aria-selected`), ↑ ↓ Inicio Fin Enter, foco inicial en el input y atrapado, y foco devuelto al cerrar. OK salvo los fallos de T7
- README: sin claves (la contraseña demo es la de la cuenta pública, igual que en `src/lib/demo.ts`). La URL de la demo y la del repositorio responden 200. Los pasos para recrearlo son correctos: Auth email/contraseña, Firestore en modo producción, publicar `firestore.rules`, `.env.local`, variables en Vercel, *Deployment Protection* y dominio autorizado. El historial de review-01 a 04 es fiel a los informes. «Más de 250 tests» cuadra (263). Enlaces a `.claude/agents/*.md` versionados. OK

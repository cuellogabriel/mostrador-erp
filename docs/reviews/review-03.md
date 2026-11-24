# Review 03 · T3 Clientes + T4 Productos y stock
Veredicto: RECHAZADO
Comprobaciones: npm run check → OK (tsc sin errores, eslint sin warnings, vitest 13 ficheros / 174 tests en verde, next build OK; `/clientes/[id]` con Partial Prerender)
Pruebas contra Firebase real (reglas publicadas, cuenta demo): 39/39 comprobaciones con el resultado esperado (detalle abajo)

## Fallos
- [D10] src/components/products/ProductFormDrawer.tsx:51 + src/lib/db/products.ts:26-34 — Al editar un producto se reescribe `stock` con el valor que tenía **al abrir el panel**, aunque el usuario no lo toque. Si mientras tanto el stock cambia (±1 desde otra pestaña o dispositivo, y con T5, una factura que descuenta unidades), al guardar se pisa con el valor viejo y el stock deja de cuadrar con lo facturado. Reproducir: producto con stock 5 → en la pestaña A abrir "Editar" → en la pestaña B pulsar "+1" (stock 6) → en A cambiar solo el precio y guardar → el stock vuelve a 5. Corrección: no enviar `stock` si el usuario no lo ha cambiado, o aplicarlo como diferencia en una transacción (`stock = actual + (nuevo − el que había al abrir)`), igual que hace `adjustStock`.
- [D14] src/components/customers/CustomerDetail.tsx:28 — "Sin indicar" en `text-slate-400` sobre blanco: contraste ≈ 2,6:1 (< 4,5:1). Es texto informativo. El mismo caso se rechazó en review-01 con el separador "o". Corrección: `text-slate-500`.
- [D14] src/components/customers/CustomersView.tsx:24 — El guion "—" de los campos vacíos en la tabla de clientes usa `text-slate-400` (≈ 2,6:1). Corrección: `text-slate-500`.

## Pruebas contra el servidor (script temporal fuera del repo, SDK web desde Node, payloads iguales a los de `src/lib/db`)
Estado previo de la cuenta demo: sin contador, sin facturas, 0 clientes, 0 productos.

Permitido (como debe):
- Crear un cliente con `serverTimestamp()`. Editarlo con `deleteField()` en los opcionales (payload de `updateCustomer`).
- Crear un producto. Editarlo con el payload de `updateProduct` (SKU borrado). Ajustar +1 en una transacción (patrón de `adjustStock`).
- **Factura F-2026-0001**: en una transacción, `set` de la factura con id = número, `set` del contador `{invoices_2026: 1}` (no existía) y descuento de 2 unidades de stock.
- **Factura F-2026-0002**: en una transacción, `update` del contador a 2 y descuento de 1 unidad.
- Marcar pagada (`paidAt`). Anular una pagada y anular una pendiente, cada una con reposición de stock en una transacción. Stock final 6 = 5 + 1 − 2 − 1 + 1 + 2. Cuadra.

Denegado (como debe, `permission-denied`):
- Clientes: cambiar `createdAt`, añadir un campo de más (en alta y en edición), nombre vacío, alta sin nombre, email que no es texto.
- Productos: stock negativo (en alta y en edición), IVA 7, `priceCents` decimal, campo de más, alta sin `minStock`.
- Aislamiento: leer y escribir en `users/<otro uid>/customers`, escribir en el documento `users/{uid}` y fuera de `users/`.
- Facturas: duplicado (`seq` igual al contador sin tocarlo), siguiente número sin subir el contador, subir el contador sin factura, id distinto del número, número sin relleno (`F-2026-3`), factura que deja el stock en negativo, des-anular (`void → pending`), cambiar el total de una factura, borrar una factura, borrar el contador.

Limpieza: el cliente y el producto de prueba están borrados (la cuenta demo vuelve a tener 0 clientes y 0 productos).
**Quedan sin poder borrarse (por reglas): `F-2026-0001` y `F-2026-0002`, las dos anuladas (`void`), y `users/{uid}/meta/counters = {invoices_2026: 2}`.** Apuntan a un cliente y a un producto que ya no existen. T8 (datos de demo) tiene que contar con que en 2026 el siguiente número de la cuenta demo es `F-2026-0003`, y el panel (T6) con que hay 2 facturas anuladas que no deben sumar en lo facturado.

## Observaciones (no bloquean)
- T3 "ficha con sus facturas y total facturado": `CustomerInvoices` es provisional (vacío, total 0,00 €) hasta T5. Aceptado porque aún no hay facturas, pero T5 tiene que sustituirlo.
- La búsqueda por NIF no encuentra "B-12345674" con guion (se guarda normalizado sin guion). Podría normalizarse la consulta igual que `validateSpanishTaxId`.

## Verificado
- D1 `npm run check` completo en verde. OK
- D2 sin `any`, `@ts-ignore` ni `as unknown as`. Toda la conversión de Firestore está en `src/lib/db/convert.ts` (campos leídos como `unknown` y estrechados). Ningún componente ni hook importa `firebase/firestore`: solo `src/lib/db/*` y `src/lib/firebase.ts`. OK
- D3 tests de las funciones nuevas de `src/lib` (`centsToInput`, `validateCustomerForm`/`customerToForm`, `validateProductForm`/`productToForm`/`parseNonNegativeInt`/`parseVatRate`, `stockStatus`/`needsRestock`/`applyStockDelta`, `normalizeText`/`matchesQuery`/`compareText`, `dataErrorMessage`). OK
- D4 sin `console.log`, TODO ni código muerto (AppShell refactorizado a `NavLinks` sin imports sobrantes). OK
- D5 sin claves en el repo. OK
- D6 todo bajo `users/{uid}` (`paths.ts`), con `uid` de `useCurrentUser()`. Reglas comprobadas en vivo (ver arriba). OK
- D7 `/clientes`, `/clientes/[id]` y `/productos` siguen detrás de `AppShell`. `useCurrentUser` solo se usa dentro de la zona privada. OK
- D8 clientes: nombre obligatorio, NIF/CIF/NIE con control si se informa, email válido, teléfono, límites iguales a las reglas. Productos: nombre y precio obligatorios, precio ≥ 0 con 2 decimales, IVA 21/10/4/0, stock y mínimo enteros ≥ 0. Errores bajo cada campo con `aria-invalid`/`aria-describedby`, y un `FormAlert` si falla el guardado. OK
- D9 precio guardado en céntimos (`toCents`). El precio con IVA de la vista previa se calcula con `calcLine`. OK
- D10 ajuste rápido ±1 en transacción, sin bajar de 0 (`InsufficientStockError` + regla `stock >= 0`). OK salvo el fallo de la edición
- D11 `formatEUR`, `formatDate`, textos en español de España, orden alfabético con `Intl.Collator("es")`. OK
- D12 listas de clientes y productos: esqueleto de carga, vacío con acción ("Añadir el primer cliente/producto"), error con "Reintentar", y vacío de búsqueda o filtro con acción para limpiar. Ficha: esqueleto, error, "no existe" con enlace. OK
- D13 `DataTable`: tarjetas en móvil (`md:hidden`), tabla con `overflow-x-auto` dentro de su contenedor. Drawer a ancho completo en móvil y diálogos con `p-4`. OK
- D14 Drawer y ConfirmDialog con `role="dialog"`/`alertdialog`, `aria-modal`, título y descripción enlazados, foco atrapado, Esc cierra, foco devuelto al cerrar y "Cancelar" con foco inicial en las confirmaciones destructivas. `IconButton` y botones de stock con `aria-label` que incluye el nombre del elemento. Interruptor "Solo stock bajo" con checkbox real y foco visible. Buscadores con `<label>` oculta. Obligatorios marcados con `*` (`aria-hidden`; el input lleva `required`). OK salvo los contrastes citados

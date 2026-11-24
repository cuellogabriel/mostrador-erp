# Review 04 · Correcciones de T3+T4 (review-03) y T5 Facturas
Veredicto T3 + T4 (correcciones): APROBADO
Veredicto T5 (Facturas): APROBADO
Comprobaciones: npm run check → OK (tsc sin errores, eslint sin warnings, vitest 16 ficheros / 225 tests en verde, next build OK; `/facturas/nueva` estática, `/facturas/[id]` con Partial Prerender)
Pruebas contra Firebase real: 7/7 escenarios en verde, con un test de Vitest temporal fuera del repo que importa directamente `src/lib/db/invoices.ts`, `customers.ts`, `products.ts` e `invoiceDraft.ts`

## Fallos
Ninguno.

## Correcciones de review-03
- [D10] Editar un producto ya no reescribe el stock. `updateProduct` recibe `Omit<ProductInput, "stock">` y no envía `stock`. Al editar, el panel muestra `StockStepper` (transacción) en lugar del campo, y "Stock inicial" solo aparece en el alta. Comprobado en vivo: tras `updateProduct` el stock queda igual. CORREGIDO
- [D14] "Sin indicar" (`CustomerDetail.tsx:28`) y el "—" (`CustomersView.tsx:24`) en `text-slate-500`. CORREGIDO
- [obs.] Búsqueda de NIF con guion: `matchesQuery` compara también sin espacios, puntos, barras ni guiones. Test "B-12345674". CORREGIDO

## T5 contra el servidor (cuenta demo)
Estado previo: `F-2026-0001` a `0004` anuladas, contador `invoices_2026 = 4`.
- **Emitir con descuento de stock**: borrador hecho con `newDraftLine` + `validateInvoiceDraft` (A ×2 con 10 % de descuento, B ×1) → `F-2026-0005`. Contador 4 → 5. Stock A 5 → 3 y B 3 → 2. Lo guardado coincide con `calcInvoice(lines)`: base 5148, IVA 818 (21 %: 756 sobre 3598; 4 %: 62 sobre 1550), total 5966. Guarda copias de `customerName`, `customerTaxId` y de cada línea (nombre, precio, IVA, descuento). Estado `pending`. OK
- **Falta stock**: pedir 10 con 3 disponibles lanza `InsufficientStockError` → «No hay stock suficiente de «ZZ Test Tornillo»: quedan 3 unidades.». No se escribe nada: el contador no se mueve, el stock no cambia y el siguiente número no existe. El borrador ya lo marca en la línea («Solo quedan 3 unidades.») y desactiva "Emitir". OK
- **Correlativa**: siguiente → `F-2026-0006`. Dos líneas del mismo producto descuentan la suma (2). OK
- **Pagada y anulada**: `markInvoicePaid` → `paid` con `paidAt`; `voidInvoice` → `void` y repone 2 unidades. Volver a anular no repone dos veces. OK
- **Anular con un producto borrado**: borrado B y anulada `F-2026-0005` → `skippedProducts = ["ZZ Test Libro"]`, A repuesto (vuelve a 5), factura `void`. La interfaz lo avisa con un toast por cada producto saltado. OK
- **Emitir con producto o cliente borrado**: `MissingProductError` («El producto «ZZ Test Libro» ya no existe. Quítalo de la factura.») y `MissingCustomerError` («El cliente ya no existe. Puede que se haya borrado: elige otro.»), sin escribir nada. OK
- **Agotar y reponer**: `F-2026-0007` deja A en 0; al anularla vuelve a 5. OK
- Limpieza: borrados todos los clientes y productos de prueba. La cuenta demo queda con 0 clientes, 0 productos, **facturas `F-2026-0001` a `F-2026-0007`, todas anuladas, y contador `invoices_2026 = 7`**.

## Observaciones (no bloquean)
- En `/facturas/nueva`, "Elige el cliente" y "Añade al menos un producto" salen en la lista de motivos junto al botón, no junto al buscador de cliente o de productos. Se entiende bien porque el botón está desactivado con su motivo, pero se podría repetir el aviso dentro de cada tarjeta.
- `InvoiceDocument` muestra "Tu empresa" + email como emisor. Para una factura legal en España faltan los datos fiscales del emisor (nombre, NIF y dirección). No lo exige el PLAN; conviene una tarea futura.

## Verificado
- D1 `npm run check` en verde. OK
- D2 sin `any`, `@ts-ignore` ni `as unknown as`. `invoiceFromSnapshot` en `convert.ts` estrecha también las líneas y el desglose. Solo `src/lib/db/*` y `src/lib/firebase.ts` importan `firebase/firestore`: ningún componente ni hook lo hace. OK
- D3 tests de todas las funciones nuevas (`invoiceDraft`, `invoiceList`, `whatsapp`, `invoiceYear`/`counterKey`, errores nuevos). OK
- D4 sin `console.log`, TODO ni código muerto. OK
- D5 sin claves. OK
- D6 todo bajo `users/{uid}`. La consulta por cliente (`where customerId ==`) la permite `allow read`. OK
- D7 rutas nuevas dentro de `(app)`, detrás de `AppShell`. OK
- D8 líneas del borrador: precio ≥ 0 con 2 decimales, cantidad entera ≥ 1, descuento de 0 a 100 con 2 decimales, cada error bajo su campo, y aviso de stock y de producto borrado en la propia línea. OK
- D9 importes en céntimos. `createInvoice` calcula los totales solo con `calcInvoice`, y la vista previa usa `draftTotals`/`calcLine`. OK
- D10 una sola transacción (lecturas antes de escrituras: contador, cliente y productos; luego factura con id = número, contador y stock). Año UTC. Anular repone stock y salta los productos borrados. Comprobado en vivo. OK
- D11 EUR es-ES, `dd/mm/aaaa`, textos en español de España. El NBSP de `Intl` se sustituye en el texto de WhatsApp. OK
- D12 `/facturas`: esqueleto, error con reintentar, vacío con "Crear la primera factura", y vacío de filtro con "Ver todas". `/facturas/nueva`: carga, error, sin clientes o sin productos con enlace. `/facturas/[id]`: esqueleto, error, "no existe". Ficha de cliente: facturas con carga, error y vacío con "Nueva factura", y total facturado sin anuladas. OK
- D13 filtros con scroll propio, `StatCard` apiladas, tabla del documento con `min-w` dentro de `overflow-x-auto`, y líneas del borrador en 3 columnas que caben a 360 px. OK
- D14 filtros con `aria-pressed`, línea del borrador como `fieldset` + `legend`, botones de quitar o añadir con el nombre del producto, enlace de WhatsApp con "(se abre en una ventana nueva)", `ConfirmDialog` al anular y contrastes ≥ 4,5:1. OK
- T5 detalle: A4 (`@page { size: A4 }`, `max-w-[210mm]`). En impresión se ocultan la barra lateral, las barras móviles, los toasts, los botones de acción y el enlace de volver. WhatsApp con `https://wa.me/?text=` + `encodeURIComponent`. "Marcar como pagada" solo en pendientes y "Anular" en pendientes y pagadas. OK

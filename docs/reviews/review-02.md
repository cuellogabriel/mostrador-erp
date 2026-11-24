# Review 02 · T1 Base + T2 Lógica pura (re-revisión de review-01)
Veredicto: APROBADO
Comprobaciones: npm run check → OK (tsc sin errores, eslint sin warnings, vitest 8 ficheros / 113 tests en verde, next build OK con 10 rutas estáticas)

## Fallos
Ninguno.

## Fallos de review-01: estado
- [T1 demo] src/lib/demo.ts:3 — `DEMO_PASSWORD = "Mostrador2026"`. Contra Firebase Auth real, `demo@mostrador.app` / `Mostrador2026` → `registered: true`. CORREGIDO
- [D10] `toList()` eliminado. `validCounterUpdate` ya no saca la clave del Set: usa `affectedKeys().hasOnly([counterKey()])` con `counterKey() = 'invoices_' + string(request.time.year())`. CORREGIDO
- [D10] Números duplicados o desligados: `validNewInvoiceNumber` exige `id == number`, que `number` sea `F-AAAA-` + seq con relleno a 4 cifras (`isInvoiceNumber`), que el contador valiera `seq - 1` antes de escribir (o no existiera y `seq == 1`) y que valga `seq` después (`getAfter`). CORREGIDO
- [D10, obs.] Huecos: el contador solo sube si en la misma escritura existe la factura con ese número (`existsAfter`). CORREGIDO
- [D14] Button primario `bg-emerald-700` (≈ 5,4:1 con blanco). CORREGIDO
- [D14] Separador "o" `text-slate-500` (≈ 4,6:1 sobre slate-50). CORREGIDO
- [obs.] TextField: `aria-describedby` solo incluye el hint cuando se pinta. CORREGIDO

## Revisión de firestore.rules (a mano, sin emulador)
- Sintaxis `rules_version = '2'`: funciones con `let` y `return`, `request.time.year()`, `string(int)`, `map.get(k, def)`, `diff().affectedKeys().hasOnly()`, `exists/get/getAfter/existsAfter` con rutas `$(...)`: todo válido.
- `get` sobre el contador inexistente: protegido. `(!exists(p) && seq == 1) || (exists(p) && get(p)... == seq - 1)`. El `&&` corta antes del `get` si el documento no existe. `getAfter` solo se evalúa cuando el contador se escribe en la misma transacción. Si no se escribe y no existe, la evaluación da error y se deniega, que es lo correcto.
- Flujos trazados (transacción: crear factura + escribir contador + actualizar productos):
  - 1.ª factura de la historia (sin contador): `invoices/F-2026-0001` cumple `!exists && seq == 1` y `getAfter == 1`. El contador se crea con `{invoices_2026: 1}`, cumple `hasOnly([clave])`, vale 1 y cumple `existsAfter(F-2026-0001)`. PERMITIDO
  - 2.ª factura: el contador `{invoices_2026: 1}` vale `seq - 1` antes y 2 después. El `update` solo afecta a `invoices_2026` (= 1 + 1) y cumple `existsAfter(F-2026-0002)`. PERMITIDO
  - 1.ª factura de un año nuevo: `get('invoices_2027', 0) == 0` y el `update` añade solo `invoices_2027 = 0 + 1`. PERMITIDO
  - Duplicado (`seq` igual al contador actual, sin tocar el contador): `get == seq - 1` falla. DENEGADO
  - Subir el contador sin crear la factura: falla `existsAfter`. DENEGADO
  - Factura con `number` ≠ id o sin relleno (`F-2026-7`): DENEGADO
  - Anular con reposición: la factura pasa de `pending|paid` a `void` (solo cambian `status`/`paidAt`) y los productos se actualizan con `stock` entero ≥ 0 (`validProduct` + `createdAt` inmutable). PERMITIDO
  - Facturar más stock del disponible: el `stock` resultante sería < 0 y falla `nonNegativeInt`. DENEGADO
- Nada abierto: todo cuelga de `users/{uid}` con `isOwner(uid)`. El propio documento `users/{uid}` y cualquier otra ruta no tienen `allow`, así que se deniegan. Facturas y contador no se pueden borrar. Una factura anulada ya no cambia de estado.
- Coste: cada transacción hace como mucho unos 4 accesos a documentos por las reglas (contador antes y después, factura después), muy por debajo del límite.

## Observaciones (no bloquean; para T5)
- `data.year == request.time.year()` usa la hora UTC del servidor. Entre las 00:00 y la 01:00 del 1 de enero (hora peninsular), un cliente que calcule el año en hora local escribiría `F-2027-…` y se le denegaría. T5 debe calcular el año con `getUTCFullYear()` o reintentar mostrando un error claro.
- Al subir el contador, T5 debe usar `transaction.update` o `set(..., { merge: true })`. Un `set` sin merge borraría las claves de años anteriores, y `affectedKeys().hasOnly([clave])` lo denegaría.
- Siguen sin poder validarse los elementos de `lines`/`vatBreakdown` (las reglas no recorren listas). El cliente debe construirlos solo con `calcInvoice`.
- Si se borra un producto ya facturado, al anular, el `update` de su stock pasa a ser una creación y fallará. T5 lo tiene que contemplar (por ejemplo, omitir los productos borrados o avisar).
- firestore.rules:85: el parámetro se llama `number`, que también es un nombre de tipo de las reglas. No hay `is number` dentro de esa función, así que no debería chocar, pero renombrarlo (`invoiceNumber`) quita la duda cuando se despliegue.

## Verificado
- D1 `npm run check` completo en verde. OK
- D2 sin `any`, `@ts-ignore` ni `as unknown as`. OK
- D3 todas las funciones de `src/lib` con tests y casos borde. OK
- D4 sin `console.log`, TODO ni restos de plantilla. OK
- D5 sin claves (`grep AIza` vacío), `.env.local` ignorado, `.env.example` vacío. OK
- D6 aislamiento por `uid` y validación de tipos y campos obligatorios. OK
- D7 HTML prerenderizado de las rutas privadas solo con "Comprobando tu sesión…"; redirige a `/login` sin sesión. OK
- D8 login y registro validan en cliente con el error junto al campo. OK
- D9 céntimos enteros, `calcInvoice` con tests de IVA 21/10/4/0 y descuentos. OK
- D10 garantizado por las reglas (ver los flujos de arriba); falta la transacción del cliente, que llega en T5. OK
- D11 es-ES, EUR, dd/mm/aaaa, `lang="es"`. OK
- D12 no aplica aún (páginas provisionales; T3–T6).
- D13 usable a 360 px. OK
- D14 labels, nombres accesibles, foco visible y contrastes corregidos. OK

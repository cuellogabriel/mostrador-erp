# Review 01 · T1 Base + T2 Lógica pura
Veredicto: RECHAZADO
Comprobaciones: npm run check → OK (tsc sin errores, eslint sin warnings, vitest 8 ficheros / 113 tests en verde, next build OK con 10 rutas estáticas)

## Fallos
- [T1 / criterio "Entrar con la cuenta demo"] src/lib/demo.ts:3 — `DEMO_PASSWORD = "mostrador-demo"`, pero la cuenta `demo@mostrador.app` que existe en Firebase Auth tiene la contraseña `Mostrador2026`. El botón no entra: muestra "El email o la contraseña no son correctos.". Reproducido contra el proyecto real con `POST identitytoolkit.googleapis.com/v1/accounts:signInWithPassword` (clave de `.env.local`): con `mostrador-demo` → `INVALID_LOGIN_CREDENTIALS`; con `Mostrador2026` → `registered: true`. Corrección: `DEMO_PASSWORD = "Mostrador2026"`.

- [D10] firestore.rules:110 — `validCounterUpdate` usa `changed.toList()[0]`, pero `affectedKeys()` devuelve un `rules.Set` y `Set` no tiene `toList()` (sus métodos son `difference`, `hasAll`, `hasAny`, `hasOnly`, `intersection`, `size`, `union`). La regla da error de evaluación → toda actualización de `users/{uid}/meta/counters` se deniega. Consecuencia: solo se puede crear la **primera factura de la historia** de cada usuario (esa pasa por `validCounterCreate`); la 2.ª factura de 2026 y la 1.ª de 2027 fallan con `permission-denied`, así que el flujo factura + stock + contador en una transacción es imposible. Reproducir (emulador o Rules Playground): con `meta/counters = {invoices_2026: 1}`, `update` a `{invoices_2026: 2}` → denegado. Sugerencia: no sacar la clave del Set; p. ej. que la factura fije el año y comprobar `changed.hasOnly([k])` con `k = 'invoices_' + string(año)`, o validar con `changed.size() == 1` + comparar contra la clave esperada.

- [D10] firestore.rules:83-86 y 128-132 — La numeración "correlativa y sin huecos" que promete el comentario no se garantiza: `matchesCounter` solo mira `getAfter(...) == seq`. Si la transacción **no toca** el contador, `getAfter` devuelve el valor actual y se acepta una factura con el mismo `seq` que la última → número duplicado. Reproducir: contador `{invoices_2026: 3}`, crear `invoices/x` con `year: 2026, seq: 3, number: "F-2026-0003"` sin escribir el contador → permitido. Además `number` no está ligado a `seq` (se acepta `seq: 3` con `number: "F-2026-0001"`). Corrección: exigir también que antes de la escritura el contador valiera `seq - 1` (`get(...).data.get(clave, 0) == seq - 1`, o inexistente con `seq == 1`) y que `number` corresponda a `seq` (p. ej. `int(data.number.split('-')[2]) == data.seq`).

- [D14] src/components/Button.tsx:11 — Botón principal con texto blanco sobre `bg-emerald-600` (≈ #009966): contraste ≈ 3,6:1, por debajo de 4,5:1 para texto de 15 px / peso 500 (no cuenta como texto grande). Afecta a "Entrar" y "Crear cuenta". Reproducir: comprobar con cualquier medidor de contraste WCAG. Corrección: `bg-emerald-700` (≈ 5,4:1) o superior.

- [D14] src/components/LoginForm.tsx:92-93 — El separador "o" usa `text-slate-400` sobre fondo `slate-50`: contraste ≈ 2,5:1. Corrección: `text-slate-500` o más oscuro.

## Observaciones (no bloquean, a tener en cuenta en T5)
- firestore.rules: el contador se puede subir sin crear factura (deja huecos en la numeración). Si la factura usa el número como id del documento, la regla del contador puede exigir `existsAfter(.../invoices/<número>)`.
- firestore.rules:63,74: los elementos de `lines` y `vatBreakdown` no se validan (las reglas no pueden recorrer listas); el cliente debe construirlos solo desde `calcInvoice`.
- Anular reponiendo stock es posible con estas reglas (factura `pending|paid → void` + `update` de productos con `stock` entero ≥ 0 en la misma transacción). Ojo: si el producto se ha borrado, el `update` se convierte en creación y fallará `validProduct`; T5 debe contemplarlo.
- src/components/TextField.tsx:17 — con `hint` y `error` a la vez, `aria-describedby` apunta al id del hint, que no se pinta. Inocuo, pero mejor incluir el hint solo si se muestra.

## Verificado
- D1 `npm run check` completo en verde, sin warnings de lint. OK
- D2 sin `any`, `@ts-ignore`, `@ts-expect-error` ni `as unknown as` en `src/`. OK
- D3 todas las funciones de `src/lib` (money, invoice, taxId, numbering, dates, validation, authErrors, navigation) con tests y casos borde (vacío, cero, negativos, redondeo half-up, descuentos con decimales). `demo.ts`/`types.ts` solo constantes/tipos. OK
- D4 sin `console.log`, TODO ni restos de la plantilla (SVG de `public/`, favicon y página inicial eliminados; `next.config.ts` limpio). OK
- D5 `grep AIza` sin resultados en ficheros versionables; `.env.local` ignorado por `.gitignore`; `.env.example` con valores vacíos. OK
- D6 reglas: todo bajo `users/{uid}` con `request.auth.uid == uid`, el resto denegado por defecto; clientes, productos y facturas validan campos obligatorios, `hasOnly`, tipos, enteros ≥ 0 en céntimos/stock, IVA ∈ {21,10,4,0}, `createdAt` inmutable; facturas no se borran y solo cambian de estado. Sintaxis `rules_version = '2'` correcta salvo el `toList()` citado. OK salvo fallos
- D7 `/panel`, `/clientes`, `/facturas`, `/productos`: el HTML prerenderizado (`.next/server/app/clientes.html`) solo contiene "Comprobando tu sesión…", sin navegación ni contenido; `AppShell` no pinta `children` hasta tener `user` y redirige a `/login` sin sesión. `AuthShell` manda a `/panel` si ya hay sesión. OK
- D8 login y registro validan en cliente (obligatorios, email, mínimo 6, confirmación) y muestran el error bajo el campo con `aria-invalid`/`aria-describedby`. OK
- D9 `calcLine`/`calcInvoice` en céntimos enteros, redondeo por línea, tests con IVA 21/10/4/0 y descuentos. OK
- D11 `formatEUR` es-ES/EUR ("12,50 €"), `formatDate` dd/mm/aaaa, textos en español de España, `lang="es"`, metadatos de Mostrador. OK
- D12 no aplica aún: las 4 páginas privadas son provisionales (EmptyState) y las sustituyen T3–T6.
- D13 layout a 360 px: barra superior + barra inferior de 4 columnas, contenido con `px-4`, formularios `max-w-sm`; sin anchos fijos que desborden. OK
- D14 inputs con `<label htmlFor>`, botón de mostrar contraseña y "Salir" compacto con `aria-label`, `nav` con `aria-label`, `aria-current` en la sección activa, foco visible global (`:focus-visible`). OK salvo contrastes citados
- T2: `toCents("12,50")` → 1250, `formatEUR(1250)` → "12,50 €", `formatInvoiceNumber(2026, 7)` → "F-2026-0007", NIF/NIE/CIF con control (probados además 12345678A ✗, Q2826000H ✓, Q28260008 ✗, X12345678L ✗). OK

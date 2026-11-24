# Review 06 · Correcciones de review-05 (T7 y T8) · revisión final antes de publicar
Veredicto T7 (Paleta Ctrl+K y portada): APROBADO
Veredicto T8 (Datos de demo y README): APROBADO
Comprobaciones: npm run check → OK (tsc sin errores, eslint sin warnings, vitest 19 ficheros / 265 tests en verde, next build OK)
Pruebas contra Firebase real: cuenta de pruebas NUEVA creada con `accounts:signUp` (no la demo) y el `seedDemoData` real. Cuenta borrada al terminar (`accounts:delete` HTTP 200; el login posterior da `INVALID_LOGIN_CREDENTIALS`).

## Fallos
Ninguno.

## Correcciones de review-05
- [D10 · T8] `src/lib/db/seed.ts:91-102`: antes de escribir comprueba a la vez clientes, productos, facturas y el contador del año, y lanza `SeedNotEmptyError` si hay algo. El estado vacío del panel (`PanelView.tsx:120`) exige ahora también 0 facturas. En vivo:
  - Seed en una cuenta nueva: 18 facturas en 44,6 s, `F-2026-0001…0018` con `issuedAt` estrictamente creciente, 8 clientes y 12 productos.
  - Segundo seed → `SeedNotEmptyError`.
  - Tras borrar todos los clientes y productos (cuenta con **solo facturas**) → `SeedNotEmptyError`, y se siguen contando 18 facturas, 0 clientes y 0 productos: no escribió nada. CORREGIDO
- [D14 · T7] Pila de modales en `useModal.ts`, revisada leyendo el código:
  - Cada modal mete un `Symbol` en `openModals` al montarse y el `keydown` sale en seguida si no es el de arriba (`openModals[length-1] !== token`). Solo el modal superior atiende Esc y Tab.
  - Al desmontar, quita su token con `indexOf` + `splice` (aunque no sea el último), restaura `overflow` y devuelve el foco al elemento previo. Así, al cerrar la paleta, el foco vuelve al input del panel de debajo.
  - Con `StrictMode`, el doble efecto saca y vuelve a meter el token sin dejar restos.
  - Paleta (`z-[55]`) encima del Drawer (`z-50`): Esc cierra solo la paleta y el borrador se conserva. CORREGIDO
- [D14 · T7] `CommandPalette.tsx:189`: id del grupo `${listId}-group-${índice}`, sin espacios. CORREGIDO
- [D14 · T7] `CommandPalette.tsx:223`: el `role="status"` está ahora fuera del `listbox`, y el listbox se oculta cuando no hay resultados. CORREGIDO
- [obs.] Portada: quitada la frase «de código abierto» (no hay `LICENSE`). CORREGIDO
- [obs.] `seedPlan.ts`: nombres con «Ejemplo/Demo/Prueba», emails `@ejemplo.es`, teléfonos `600 000 0XX` y direcciones «Calle Ejemplo/Ficticia/Inventada». CORREGIDO
- [obs.] `SeedInterruptedError` si el seed falla después de escribir algo (con mensaje en español). Si no había escrito nada, se relanza el error original para poder reintentar. CORREGIDO

## Observaciones (no bloquean)
- El mensaje de `SeedInterruptedError` dice «Borra la cuenta o sigue a mano», pero la app no tiene opción para borrar la cuenta. Mejor: «Sigue a mano o crea otra cuenta para cargar los datos de ejemplo».
- Las reglas siguen aceptando cualquier `issuedAt` pasado del año en curso. Hoy solo lo aprovecha el seed, que ya se protege, pero un cliente modificado podría emitir con fecha anterior a la última factura. Queda como mejora posible, no como bloqueo.
- En una primera ejecución del test, la salida de consola salió silenciada. Esa ejecución creó otra cuenta de pruebas con el mismo `afterAll` que hace `accounts:delete`. El borrado solo está confirmado en el log de la segunda.

## Verificado
- D1 `npm run check` en verde. OK
- D2 / D4 / D5 sin cambios que afecten: sin `any`, sin código muerto y sin claves. `firestore.rules` no se ha tocado en esta ronda. OK
- D3 tests nuevos para `SeedInterruptedError` y el seed (265 en total). OK
- D10 el seed solo arranca con la cuenta realmente vacía (comprobado en vivo). OK
- D12 el panel solo ofrece «Cargar datos de ejemplo» sin clientes, productos ni facturas. Con solo facturas, muestra el panel normal. OK
- D14 paleta: combobox correcto, nombres de grupo válidos, estado fuera del listbox y teclado sin cerrar modales de debajo. OK

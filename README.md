# Mostrador

**Facturación y stock para pymes, sin complicaciones.** Un mini-ERP hecho con Next.js y Firebase: clientes, productos con stock, facturas con IVA y un panel con lo importante del negocio.

- **Demo:** https://mostrador-erp-cosechasimple.vercel.app
- **Usuario demo:** `demo@mostrador.app` / `Mostrador2026` (o el botón «Entrar con la cuenta demo» en el login)

## Qué hace

- **Facturas con IVA**: numeración correlativa `F-AAAA-NNNN` sin huecos ni duplicados, líneas con cantidad, precio y descuento, desglose por tipo (21, 10, 4 y 0 %), totales en vivo, aviso si no hay stock, detalle con aspecto de factura A4, imprimir o guardar en PDF, enviar un resumen por WhatsApp, marcar como pagada y anular (repone el stock).
- **Productos y stock**: precio sin IVA, tipo de IVA, stock y stock mínimo; avisos de «Stock bajo» y «Agotado», ajuste rápido +/− y filtro «solo stock bajo». Cada factura descuenta el stock en la misma operación.
- **Clientes**: NIF, CIF o NIE validado con su letra o dígito de control, email, teléfono, dirección y notas; ficha con sus facturas y el total facturado.
- **Panel**: facturado este mes (con la variación frente al anterior), pendiente de cobro, clientes, productos por reponer, gráfico de los últimos 6 meses, últimas facturas y stock bajo. Con la cuenta vacía (sin clientes, productos ni facturas), botón **«Cargar datos de ejemplo»**.
  - Los datos de ejemplo son **ficticios**: empresas con «Ejemplo» o «Demo» en el nombre, emails `@ejemplo.es`, teléfonos `600 000 0XX` y NIF/CIF/NIE **generados** solo para que pasen la validación de la letra o el dígito de control; no corresponden a nadie a propósito.
- **Ajustes**: datos fiscales de tu empresa (emisor), que cada factura copia al emitirse.
- **Paleta de comandos** (`Ctrl/⌘ + K`): busca clientes, productos y facturas y lanza acciones (nueva factura, nuevo cliente…).
- **Tiempo real**: si abres la app en dos pestañas o dispositivos, los cambios aparecen al instante.
- Interfaz en español de España, usable en el móvil (desde 360 px) y accesible con teclado y lector de pantalla.

## Cómo se trabajó: un equipo de 3 agentes de Claude Code

El código no lo escribió una persona tecleando: lo hizo un equipo de tres agentes de [Claude Code](https://claude.com/claude-code), cada uno con un papel y unas reglas escritas en el propio repositorio.

| Agente | Archivo | Papel |
|---|---|---|
| Orquestador | [`CLAUDE.md`](CLAUDE.md) | Mantiene el plan, divide el trabajo en tareas con criterios de aceptación, las reparte y solo las cierra con una revisión aprobada. No programa. |
| develop | [`.claude/agents/develop.md`](.claude/agents/develop.md) | Programa cada tarea siguiendo su guía (TypeScript estricto, lógica pura testeada en `src/lib`, transacciones…). |
| testing | [`.claude/agents/testing.md`](.claude/agents/testing.md) | Tiene las **14 DIRECTRICES** (D1–D14) que develop debe cumplir. Ejecuta las comprobaciones, revisa el código y escribe un informe con veredicto. |

```
            docs/PLAN.md
                 │  tarea T<n> + criterios
                 ▼
         ┌──────────────┐   entrega    ┌──────────────┐
         │   develop    │ ───────────► │   testing    │
         │  (programa)  │              │  (D1 … D14)  │
         └──────────────┘ ◄─────────── └──────┬───────┘
                 ▲   fallos (review-NN.md)    │ APROBADO
                 │                            ▼
                 └────── orquestador ── marca la tarea como hecha en PLAN.md
```

- Plan y estado de cada tarea: [`docs/PLAN.md`](docs/PLAN.md)
- Informes de testing, uno por revisión: [`docs/reviews/`](docs/reviews/)

### El historial, tal cual

No todo salió a la primera, y eso es lo interesante: los rechazos de testing encontraron fallos reales.

- **[review-01](docs/reviews/review-01.md) · T1 + T2: RECHAZADA.** Lo más serio estaba en `firestore.rules`: la regla del contador de facturas usaba `toList()` sobre un `Set`, que no existe, así que *cualquier* factura después de la primera habría sido denegada. Además, las reglas no impedían números duplicados (bastaba con no tocar el contador). También: la contraseña de la cuenta demo no coincidía con la real y dos textos no llegaban al contraste mínimo (botón principal y separador del login).
- **[review-02](docs/reviews/review-02.md): APROBADA.** Las reglas pasaron a exigir que el contador valga `seq − 1` antes y `seq` después de la transacción, que el id del documento sea el número y que el contador solo suba si se crea la factura con ese número (sin huecos).
- **[review-03](docs/reviews/review-03.md) · T3 + T4: RECHAZADA.** Testing probó contra Firebase real (39 comprobaciones de reglas) y encontró que **editar un producto pisaba el stock**: el formulario reenviaba el stock que había al abrir el panel, así que un +1 desde otra pestaña (o una factura) se perdía al guardar. Y otros dos textos con poco contraste.
- **[review-04](docs/reviews/review-04.md) · correcciones + T5: APROBADA.** Editar ya no toca el stock (solo cambia con transacciones) y el flujo de facturas se probó de punta a punta contra Firebase: emitir, quedarse sin stock, cobrar, anular con un producto borrado…
- Las siguientes revisiones (panel, paleta, portada, datos de ejemplo y ajustes del emisor) están en la misma carpeta.

## Stack

- **Next.js 16** (App Router, Turbopack, Cache Components) · **React 19** · **TypeScript** estricto
- **Tailwind CSS 4** · iconos **lucide-react** · gráficos **Recharts**
- **Firebase**: Authentication (email y contraseña) y **Cloud Firestore**, con el SDK web modular
- **Vitest** para los tests · desplegado en **Vercel**

## Cómo recrearlo paso a paso

Todo lo necesario está en este repositorio **salvo las claves de Firebase**, que nunca se suben. Para recrearlo usas tu propio proyecto de Firebase, que es gratis en el plan Spark.

1. **Crea el proyecto de Firebase** en la [consola](https://console.firebase.google.com/):
   - *Authentication* › *Sign-in method* › activa **Correo electrónico/contraseña**.
   - *Firestore Database* › crear base de datos en **modo producción** (la región que prefieras, por ejemplo `eur3`).
   - *Configuración del proyecto* › *Tus apps* › añade una **app web** y copia su configuración.
2. **Publica las reglas**: copia el contenido de [`firestore.rules`](firestore.rules) en *Firestore* › *Reglas* y pulsa *Publicar* (o `firebase deploy --only firestore:rules` si usas la CLI).
3. **Variables de entorno**: copia `.env.example` a `.env.local` y rellena los `NEXT_PUBLIC_FIREBASE_*` con la configuración de la app web.
4. **Instala y arranca**:
   ```bash
   npm i
   npm run dev        # http://localhost:3000
   ```
   Crea una cuenta en `/registro` y, en el panel, pulsa «Cargar datos de ejemplo». Si quieres el botón de la cuenta demo, crea en *Authentication* el usuario `demo@mostrador.app` con la contraseña de `src/lib/demo.ts`.
5. **Despliega en Vercel**: importa el repositorio, añade las mismas seis variables `NEXT_PUBLIC_FIREBASE_*` en *Settings* › *Environment Variables* y despliega. Para que la demo sea pública, desactiva *Settings* › *Deployment Protection* (Vercel Authentication). Añade también el dominio de Vercel en Firebase › *Authentication* › *Settings* › *Dominios autorizados*.

### Comandos

```bash
npm run dev     # desarrollo
npm test        # tests unitarios (Vitest)
npm run check   # tipos + lint + tests + build: lo que exige testing (D1)
```

## Decisiones técnicas

- **Dinero en céntimos.** Todos los importes se guardan como enteros en céntimos y se formatean con `Intl.NumberFormat('es-ES', { currency: 'EUR' })`. Nunca se suman decimales de euros. El IVA y los descuentos se redondean al céntimo por línea con aritmética entera (`src/lib/invoice.ts`, con tests de los cuatro tipos de IVA).
- **Lógica pura y testeada.** Cálculos, validaciones (NIF/CIF/NIE, formularios, borrador de factura), numeración, agregados del panel y el plan de datos de ejemplo viven en `src/lib/` sin React ni Firebase, con más de 250 tests.
- **Transacciones.** Emitir una factura es **una sola transacción** de Firestore: lee el contador del año, el emisor, el cliente y los productos; comprueba el stock; escribe la factura, sube el contador y descuenta el stock. Anular también es una transacción que repone el stock.
- **Numeración sin huecos garantizada en el servidor.** `firestore.rules` exige que la factura tenga como id su número `F-AAAA-NNNN`, que el contador valiera `seq − 1` antes y `seq` después, y que el contador solo suba si en la misma escritura se crea esa factura. Las facturas no se borran: se anulan.
- **Reglas de seguridad.** Cada usuario solo accede a `users/{uid}/…`. Cada escritura valida campos obligatorios, tipos, longitudes, IVA permitido y enteros ≥ 0 (el stock no puede quedar negativo ni con dos pestañas a la vez).
- **Copias en la factura.** La factura guarda su copia del cliente, del emisor y de cada línea (nombre, precio, IVA), así que borrar o editar después un cliente o un producto no cambia lo ya emitido.
- **Tiempo real.** Las pantallas leen con `onSnapshot`, siempre en el navegador y después del login: la zona privada no muestra nada sin sesión (ni en el HTML prerenderizado). La conversión de Firestore a los tipos de la app está en un único sitio (`src/lib/db/convert.ts`).

---

Hecho por **Gabriel Cuello**.

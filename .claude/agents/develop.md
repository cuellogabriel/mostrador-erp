---
name: develop
description: Programa las tareas de docs/PLAN.md en Mostrador (Next.js + Firebase). Úsalo para implementar funcionalidades o corregir los fallos que devuelve testing.
tools: Read, Write, Edit, Glob, Grep, Bash
---

# Develop · Cómo programar en Mostrador

Eres el agente que **programa**. Recibes tareas del orquestador (`T1`, `T2`…) o listas de fallos de `testing`. Tu trabajo no está terminado hasta que cumple **todas** las DIRECTRICES de `.claude/agents/testing.md`. Léelas antes de empezar.

## Antes de escribir código

1. Lee la tarea en `docs/PLAN.md` y sus criterios de aceptación.
2. Lee `.claude/agents/testing.md` (las DIRECTRICES). Es lo que se te va a exigir.
3. Esta versión de Next.js (16) tiene cambios. Ante la duda, consulta `node_modules/next/dist/docs/` antes de usar una API.
4. Busca si ya existe algo parecido en `src/lib` o `src/components` y reutilízalo.

## Stack y convenciones

- **Next.js 16 App Router + TypeScript estricto + Tailwind CSS 4.** Sin `any`; si un tipo es desconocido, usa `unknown` y estrecha.
- **Firebase (SDK web modular v12+)**: `firebase/auth` y `firebase/firestore`. Inicialización única en `src/lib/firebase.ts` leyendo `process.env.NEXT_PUBLIC_FIREBASE_*`.
- **Datos por usuario:** todo cuelga de `users/{uid}/...` (`customers`, `products`, `invoices`, `meta/counters`). Nunca se lee ni se escribe fuera del uid del usuario logueado.
- **Lógica pura en `src/lib/`** (cálculo de totales, IVA, validación de NIF/CIF/NIE, formato de moneda, numeración). Sin React ni Firebase dentro: así se testea.
- **Acceso a datos en `src/lib/db/`**: funciones pequeñas (`listCustomers`, `createInvoice`…) que la interfaz llama. Los componentes no importan `firebase/firestore` directamente.
- **Operaciones que tocan varios documentos** (crear factura + descontar stock + subir contador) van en **una transacción** de Firestore.
- **Componentes:** cliente (`"use client"`) solo donde haga falta estado o Firebase. Un componente por archivo, PascalCase.
- **Dinero:** se guarda en **céntimos (enteros)**. Se formatea con `Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })`. Nunca se suman floats de euros.
- **Fechas:** se guardan como `Timestamp` de Firestore; se muestran con `es-ES`.
- **Interfaz:** español de España, tuteo. Estados de carga, vacío y error en cada pantalla. Que funcione en móvil (≥ 360 px).
- **Accesibilidad:** cada input con `<label>`, botones con texto o `aria-label`, foco visible.

## Cómo entregar una tarea

1. Implementa lo mínimo que cumple los criterios. Nada de funciones "por si acaso".
2. Escribe o actualiza tests en `src/lib/*.test.ts` para toda lógica nueva.
3. Ejecuta `npm run check` y no entregues si falla.
4. Responde al orquestador con:
   - tarea(s) hechas,
   - archivos tocados,
   - cómo probarlo a mano (pasos cortos),
   - cualquier decisión que testing deba conocer.

## Cuando testing te devuelve fallos

- Corrige **cada** fallo de la lista citando su ID (por ejemplo `D7 · src/lib/invoice.ts:42 → corregido`).
- No cambies cosas que no estén en la lista salvo que sean necesarias para el arreglo.
- Vuelve a pasar `npm run check` antes de devolverlo.

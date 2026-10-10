# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Una sola persona, quien mantiene el laboratorio, que usa Lara a diario desde su propio equipo para revisar sus finanzas personales. No hay otros usuarios reales; existen usuarios de prueba solo para probar roles y menú.

## Product Purpose

Lara es una asistente de finanzas personales con chat: ayuda a revisar gastos, gastos fijos frente al sueldo, proyecciones e inversiones, y ofrece recomendaciones educativas (por ejemplo, explicar el costo de pagar el mínimo frente al total de una tarjeta). También incluye vistas para inspeccionar el propio laboratorio: estado de los servicios, agentes, base de datos, memoria y herramientas.

Éxito (inferido): que las cifras sean correctas y reproducibles, que se sepa con precisión qué datos salen al proveedor del modelo y que la interfaz resulte clara para un uso diario.

## Positioning

Los datos financieros se guardan en el equipo, en la PostgreSQL local del microservicio de finanzas, y los cálculos (resumen mensual, calendario de pagos) se hacen en código con pruebas, no en el modelo.

Lo que **no** es local: el chat usa modelos de lenguaje en la nube (Gemini y DeepSeek, mediante LiteLLM). Al proveedor se envían el mensaje del usuario, el historial de la conversación y lo que devuelven las herramientas:

- Consultas: el resumen mensual (categoría, tipo, moneda y total) y el calendario (fecha, tipo y alias de tarjeta).
- Registros: la vista previa y el registro creado (fecha, monto, moneda, comercio, categoría, alias y últimos cuatro dígitos), porque el modelo los arma a partir de lo que el usuario escribe en el chat.
- Antes de devolver datos al modelo se elimina `ownerSub`. El código del orquestador no incluye tokens ni secretos en lo que envía al modelo.

Estado (confirmado en `agents/orquestador`): no hay enmascarado de comercios, alias ni montos antes de enviarlos al proveedor. La afirmación de que el modelo "recibe solo agregados" no es cierta para los registros.

Política vigente: [ADR-0007](docs/decisions/0007-politica-de-datos-hacia-el-proveedor.md). Las herramientas solo devuelven al modelo los campos permitidos por ruta (nunca `ownerSub` ni `ultimos4`) y, tras una escritura confirmada, solo el estado y el `id`.

## Operating Context

- Uso local en Windows; Lara es una app React + Vite + Tailwind 4 que se sirve en `localhost:5173`.
- Inicio de sesión con Keycloak (realm `lab`); las secciones visibles dependen de los roles del token.
- Chat con un orquestador de agentes ADK; las finanzas las sirve un microservicio propio.
- La identidad (menú por rol, sincronización BPM) es un track de pruebas de baja prioridad.

## Capabilities and Constraints

- Confirmado: chat con streaming, finanzas (tarjetas, movimientos, resumen mensual y calendario de pagos), gastos fijos y vistas de inspección (agentes, base de datos, memoria, herramientas, menú por rol, usuarios y roles).
- Restricciones: el repo es público, así que no puede contener datos reales, secretos ni tokens; los datos de relleno son ficticios. Los tokens viven solo en memoria. `localStorage` solo guarda dos preferencias visuales: la fuente elegida (`lara.fuente`) y el tema (`lara.tema`: sistema, claro u oscuro).
- Idioma de la interfaz: español.
- Por decidir: qué vistas conservarán su forma actual cuando haya backend real en lugar de mocks.
- Por decidir: qué datos pueden enviarse al proveedor del modelo y si se enmascaran comercio, alias y montos antes de enviarlos.

## Brand Commitments

Nombre: Lara. Tono sobrio y claro, con tema claro y oscuro (restricción visual vinculante indicada por quien mantiene el laboratorio). La fuente visual es `docs/design/lara/` (README, PNG y HTML de mockups) y los tokens de `apps/lara-web/src/index.css`; manda sobre cualquier skill de diseño.

## Evidence on Hand

- `docs/design/lara/`: guía visual, PNG y HTML de las pantallas 01–14.
- `docs/decisions/0005-enfoque-finanzas-personales.md`: enfoque del producto (su texto sobre qué recibe el modelo debe revisarse contra el código; ver Positioning).
- No hay usuarios reales, testimonios, métricas ni datos financieros reales; no deben inventarse.

## Product Principles

1. Los datos financieros se guardan en el equipo; lo que se envía al proveedor del modelo se limita a lo que el chat y las herramientas necesitan, y está documentado.
2. Las cifras las calcula el código y se verifican con pruebas, no el modelo.
3. Las recomendaciones son educativas, no asesoría financiera personalizada.
4. La interfaz es sobria y legible antes que llamativa.
5. Lo que falta de backend se rellena con datos ficticios y se marca como tal.

## Accessibility & Inclusion

Uso en pantallas desde 320 px de ancho, áreas táctiles de 44 px, respeto a `prefers-reduced-motion` y contraste suficiente en tema claro y oscuro (criterios de UI-08 y de `CLAUDE.md`).

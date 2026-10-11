# UI-11 · Herramientas MCP agrupadas por agente

- Estado: Pendiente
- Prioridad: Baja
- Parte del lab: mejora sobre la pantalla 08 (no bloquea nada de UI-10)
- Depende de: AG-01
- Fecha: 2026-10-10
- Contexto: `HerramientasPage` hoy lista `herramientasConfig` como una tabla plana (herramienta, origen, permiso), sin distinguir a qué agente pertenece cada una. Con más agentes en camino (AG-02 traductor, AG-03 cálculos financieros, finanzas ya tiene las suyas), conviene agrupar por agente — "este agente tiene tales tools" — en vez de una lista única.
- Criterio de aceptación:
  - La pantalla agrupa las herramientas por agente (un bloque o sección por agente), no una tabla plana.
  - El catálogo sigue viniendo de configuración estática en `domain/catalogoLab.ts` (no es un puerto ni depende de backend real) hasta que exista un endpoint que liste tools dinámicamente.
  - El PNG de referencia (`docs/design/lara/png/08-herramientas.png`) se revisa y se documenta cualquier diferencia antes de cambiar el layout.
- Archivos relevantes:
  - apps/lara-web/src/domain/catalogoLab.ts
  - apps/lara-web/src/ui/HerramientasPage.tsx
  - docs/design/lara/png/08-herramientas.png
- Notas:
  - Confirmado: no depende de AG-06 (MCP filesystem) ni de ningún backend nuevo; es reordenar lo que ya existe.
  - Inferido: cuando AG-02/AG-03 tengan tools propias, agruparlas por agente ya deja la pantalla lista para mostrarlas sin rediseño adicional.

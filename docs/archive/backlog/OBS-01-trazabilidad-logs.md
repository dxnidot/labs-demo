# OBS-01 · Trace id propagado y logs JSON en kc-demo, orquestador y Lara

- Estado: Pendiente
- Prioridad: Media
- Parte del lab: Observabilidad
- Depende de: UI-02
- Fecha: 2026-09-30
- Contexto: Correlacionar una petición desde Lara a través del API server, el orquestador y kc-demo.
- Criterio de aceptación:
  - Una petición desde Lara muestra el mismo `traceId` en los logs de Lara/API server, orquestador y kc-demo.
- Archivos relevantes: `agents-ui/`, `agents/`, `kc-demo/`
- Notas: Seguir [ADR-0004](../decisions/0004-trazabilidad-y-logs.md).

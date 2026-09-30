# FIN-05 · Captura de cargos desde notificaciones del celular (Android, app de automatización)

- Estado: Pendiente
- Prioridad: Baja
- Parte del lab: Finanzas
- Depende de: FIN-01
- Fecha: 2026-09-30
- Contexto: Historia opcional para capturar cargos de una wallet desde notificaciones de Android mediante una app de automatización.
- Criterio de aceptación:
  - Una notificación de prueba de la wallet genera una fila con fecha, monto, moneda y comercio.
  - Notificaciones de otras apps no generan filas.
  - El CSV vive en `agents/data/` y `git check-ignore` confirma que está ignorado.
- Archivos relevantes: `agents/`, `agents/data/`
- Notas:
  - Confirmado: iOS no permite leer notificaciones de otras apps. El permiso de notificaciones ve todas las apps: filtrar solo la wallet y guardar solo esos cuatro campos.
  - Pendiente: formato exacto del texto de la notificación y cargos en moneda extranjera.
  - Publica `CargoRegistrado` ([ADR-0003](../decisions/0003-arquitectura-por-eventos.md)).

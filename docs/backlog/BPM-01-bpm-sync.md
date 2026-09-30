# BPM-01 · Servicio bpm-sync: dry-run, idempotente, grupo básico por defecto, detección de huérfanas

- Estado: Pendiente
- Prioridad: Media
- Parte del lab: BPM
- Depende de: KC-01
- Fecha: 2026-09-30
- Contexto: La sincronización del proceso de negocio requiere un servicio seguro y repetible. Debe poder ejecutarse en modo de prueba, no duplicar elementos y detectar inconsistencias para limpiar la data del laboratorio.
- Criterio de aceptación:
  - `grep -R "dry-run\|idempotent\|orphan\|default group\|bpm-sync" .` encuentra la configuración del servicio y su contrato de operación.
  - Un comando de dry-run devuelve una salida resumida sin escribir cambios persistentes.
  - La prueba de huérfanos marca usuarios o grupos sin referencia válida y los presenta en un reporte verificable.
- Archivos relevantes:
  - .
  - docs/plans/
- Notas:
  - Confirmado: este servicio no es el núcleo del producto, pero sí añade robustez al lab.
  - Inferido: las tareas dependen del estado de Keycloak y del realm del laboratorio.
  - Pendiente: confirmar si el servicio sale del módulo de seguridad o del módulo de negocio del lab.
  - Publica `UsuarioCambioPuesto` ([ADR-0003](../decisions/0003-arquitectura-por-eventos.md)).

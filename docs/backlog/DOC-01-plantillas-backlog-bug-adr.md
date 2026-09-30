# DOC-01 · Plantillas de backlog, bug y ADR + ADR 0001 de versiones

- Estado: En curso
- Prioridad: Alta
- Parte del lab: Docs
- Depende de: —
- Fecha: 2026-09-30
- Contexto: El repositorio necesita una estructura pública para decisiones, bugs y backlog con un formato consistente. La versión de dependencias también debe quedar documentada para que el lab pueda compararse con la línea base del proyecto.
- Criterio de aceptación:
  - `git ls-files docs/backlog docs/bugs docs/decisions docs/plans` devuelve los archivos del catálogo documental del repositorio.
  - `grep -R "ADR-0001\|ADR-0002\|versiones" docs/decisions docs/plans` encuentra la decisión de versiones y los ADRs asociados.
  - `git diff -- docs/backlog docs/decisions docs/plans` muestra solo cambios de documentación, sin secretos ni datos personales.
- Archivos relevantes:
  - docs/backlog/
  - docs/decisions/
  - docs/plans/
- Notas:
  - Confirmado: la estructura documental pública debe vivir en docs/ y ser neutral.
  - Inferido: el ADR de versiones solo necesita capturar la línea base actual y el estado inherente del proyecto.
  - Pendiente: confirmar la versión final exacta para cada componente antes de cerrar la decisión.

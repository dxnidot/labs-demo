# FIN-04 · Importador de estado de cuenta de inversiones (PDF mensual) y valuación con precios públicos

- Estado: Pendiente
- Prioridad: Baja
- Parte del lab: Finanzas
- Depende de: FIN-01
- Fecha: 2026-09-30
- Contexto: Importar un estado de cuenta de inversiones mensual y valuar las posiciones con precios de una fuente pública.
- Criterio de aceptación:
  - Un PDF de ejemplo genera las posiciones y movimientos esperados.
  - Los precios se obtienen de una fuente pública.
  - Los PDF viven en `agents/data/` y `git check-ignore` confirma que están ignorados.
- Archivos relevantes: `agents/`, `agents/data/`
- Notas:
  - Inferido: no hay API pública para clientes; nunca usar credenciales de la cuenta de inversión en scripts.
  - Publica `CargoRegistrado` o `MovimientoInversionRegistrado`, según el caso ([ADR-0003](../decisions/0003-arquitectura-por-eventos.md)).

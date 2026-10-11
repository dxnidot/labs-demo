# FE-02 · Angular 22.2.1 con ng update (TypeScript se queda en 6.0)

- Estado: Pendiente
- Prioridad: Baja
- Parte del lab: Frontend
- Depende de: —
- Fecha: 2026-09-30
- Contexto: La parte Angular del laboratorio puede requerir actualización para mantenerla alineada con versiones recientes. Esto debe hacerse con una estrategia conservadora para no forzar un cambio de ecosistema completo.
- Criterio de aceptación:
  - `cd kc-front && npx ng version` muestra la versión Angular actual y la compatibilidad del entorno.
  - `npx ng update @angular/core@22.2.1 @angular/cli@22.2.1` se ejecuta sin romper el proyecto.
  - `npm ls typescript` confirma que TypeScript permanece compatible con la versión actual del proyecto y no se fuerza una actualización sin validar.
- Archivos relevantes:
  - kc-front/package.json
  - kc-front/angular.json
- Notas:
  - Confirmado: la actualización debe ser puntual y con validación de compatibilidad.
  - Inferido: Angular y TypeScript pueden requerir un enfoque paralelo para evitar breakage.
  - Pendiente: revisar el nivel exacto de compatibilidad con el proyecto final del front.

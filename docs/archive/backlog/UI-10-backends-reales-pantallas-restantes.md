# UI-10 · Backends reales para Base de datos, Menú por rol, Usuarios y roles y Gastos fijos

- Estado: Pendiente
- Prioridad: Media
- Parte del lab: fase C restante de UI-09 (post-visual)
- Depende de: UI-09 (fase C cerrada; estas 4 pantallas quedaron con mock a propósito)
- Fecha: 2026-10-10
- Contexto: `apps/lara-web/src/infrastructure/composition.ts` usa mock para `baseDatos`, `menuPorRol`, `usuariosRealm` y `gastosFijos` incluso en `crearReales()`, porque no existe backend real todavía. Cada pantalla tiene su propio bloqueo y orden de ataque:
  1. **Base de datos (06):** bloqueada por `AG-05` — sin sesión persistente en SQLite no existen `events`/`app_states`/`user_states` que consultar.
  2. **Gastos fijos (13):** depende de `FIN-03` (detección de gastos fijos en `kc-finanzas`), mismo patrón ya probado en `FIN-09`/`FIN-11`.
  3. **Menú por rol (09):** lift bajo — `kc-menu` (AG-01/KC-02, ya hecho) ya filtra por rol vía JWT; falta un modo o endpoint que acepte el set fijo de usuarios de prueba que hoy simula el mock.
  4. **Usuarios y roles (10):** la más sensible — necesita un client de servicio nuevo en Keycloak con permisos de Admin REST API (lectura de usuarios/roles del realm `lab`), superficie de seguridad nueva a decidir antes de crearla.
- Criterio de aceptación (uno por pantalla, cada una reemplaza su mock en `composition.ts` al cerrar):
  - [ ] Base de datos: adaptador HTTP real sobre un endpoint de solo lectura en `agents/orquestador/api.py` (depende de AG-05).
  - [ ] Gastos fijos: adaptador HTTP real contra el endpoint nuevo de `kc-finanzas` (depende de FIN-03).
  - [ ] Menú por rol: adaptador HTTP real contra `kc-menu` con el set de usuarios de prueba.
  - [ ] Usuarios y roles: adaptador HTTP real contra la Admin REST API de Keycloak, con el client de servicio ya autorizado y acotado.
- Archivos relevantes:
  - apps/lara-web/src/application/ports/BaseDatosPort.ts, MenuPorRolPort.ts, UsuariosRealmPort.ts, GastosFijosPort.ts
  - apps/lara-web/src/infrastructure/composition.ts
  - apps/lara-web/src/infrastructure/mocks/MockBaseDatosAdapter.ts, MockMenuPorRolAdapter.ts, MockUsuariosRealmAdapter.ts, MockGastosFijosAdapter.ts
- Notas:
  - Confirmado: orden de ataque por lift técnico, no por número de pantalla — Gastos fijos y Menú por rol antes que Usuarios y roles.
  - Pendiente: alcance exacto del client de servicio de Keycloak para Usuarios y roles (qué roles/scopes necesita, si se reutiliza `finanzas-agent` o se crea uno nuevo).

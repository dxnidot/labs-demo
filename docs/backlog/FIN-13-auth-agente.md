# FIN-13 · Autenticación del agente hacia finanzas

- Estado: Hecho
- Prioridad: Alta
- Parte del lab: Finanzas / Seguridad
- Depende de: FIN-11
- Fecha: 2026-09-30
- Cerrado: 2026-09-30
- Contexto: Autorizar al agente ADK a llamar finanzas con client credentials y un rol exclusivo, indicando el sujeto de usuario por `X-User-Sub` únicamente cuando el JWT corresponde a ese cliente y rol. Los JWT de usuario continúan funcionando con su `sub`.
- Criterio de aceptación:
  - Un JWT de usuario autenticado mantiene el comportamiento actual y usa su propio `sub` como propietario.
  - Para el agente, finanzas exige client ID esperado, rol del agente y un `X-User-Sub` no vacío; solo entonces usa ese valor como propietario.
  - Los demás clientes no pueden obtener propietario mediante `X-User-Sub`; se rechaza el acceso.
  - El secreto del cliente se consume únicamente por variable de entorno fuera de finanzas; nunca se incorpora al repo, logs o respuestas.
  - Las pruebas cubren usuario, agente autorizado, header ausente/vacío, client ID/rol no autorizados y JWT de otro cliente que falsifica el header.
  - Documentar y ejecutar manualmente estos pasos en Keycloak, realm `lab`:
    1. Abrir **Clients** y crear cliente OIDC con ID `finanzas-agent`.
    2. En **Settings**, activar **Client authentication** y **Service account roles**; guardar.
    3. En **Credentials**, obtener la credencial del cliente; cargarla solo como variable de entorno del agente, nunca en archivos públicos.
    4. En **Roles**, crear el client role `usar-finanzas`.
    5. En **Client Scopes**, abrir el scope dedicado y verificar que sus role scope mappings incluyen `usar-finanzas`; mantener **Full Scope Allowed** desactivado.
    6. En **Service Account Roles**, asignar al service account únicamente el client role `usar-finanzas`.
    7. Verificar el acceso con client credentials y comprobar, sin imprimir ni registrar el token, que el JWT identifica `azp=finanzas-agent` y lleva el rol bajo `resource_access.finanzas-agent.roles`.
  - Variables de entorno: el servicio valida `FINANZAS_AGENT_CLIENT_ID` (default `finanzas-agent`); el consumidor ADK de FIN-14 usa `FINANZAS_AGENT_CLIENT_ID`, `FINANZAS_AGENT_CLIENT_SECRET`, `FINANZAS_AGENT_TOKEN_URL` y `FINANZAS_API_URL`. El client role requerido por el servicio es `usar-finanzas`.
  - `.\mvnw.cmd test` pasa.
- Archivos relevantes:
  - `finanzas/`
  - `agents/` (configuración del cliente consumidor se implementa en FIN-14)
- Notas:
  - Confirmado: Keycloak documenta service accounts por cliente y roles de cliente; Spring Security Resource Server valida JWT antes de autorizar.
  - Confirmado: según la guía oficial de Keycloak, client credentials requiere Client authentication y Service account roles; el token contiene roles resultantes de role scope mappings y service account roles. Consultada: https://www.keycloak.org/docs/latest/server_admin/#_service_accounts
  - Confirmado: las pruebas unitarias y de módulo pasan; no fue necesario usar credenciales ni datos reales.
  - Pendiente: el dueño configurará manualmente el cliente y sus roles en Keycloak, y definirá localmente las variables de entorno listadas arriba.
  - Pendiente: AG-07 endurecerá la validación JWT del agente.

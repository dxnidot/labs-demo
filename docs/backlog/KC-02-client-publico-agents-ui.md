# KC-02 · Client público agents-ui en realm lab (C.1)

- Estado: Pendiente
- Prioridad: Alta
- Parte del lab: C.1
- Depende de: —
- Fecha: 2026-09-30
- Contexto: La interfaz de Lara necesita un client público en Keycloak para autenticar sin secretos del lado del navegador. Esto mantiene la sesión del usuario aislada por aplicación y facilita la validación de tokens PKCE.
- Criterio de aceptación:
  - `curl -s http://localhost:8080/admin/realms/lab/clients | jq '.[] | select(.clientId=="agents-ui")'` devuelve el client `agents-ui` creado en el realm `lab`.
  - La configuración del cliente en la UI de Keycloak incluye `http://localhost:5173/*` en redirect URIs y `http://localhost:5173` en Web origins.
  - La sesión de autenticación de `ana` confirma que el usuario entra con PKCE sin client secret.
- Archivos relevantes:
  - keycloak/compose.yaml
  - docs/plans/estado-lab.md
- Notas:
  - Confirmado: la app es pública y no debe manejar secretos del navegador.
  - Inferido: el login debe ser `checkLoginIframe=false` para simplificar el flujo local.
  - Pendiente: validar el client actual y el realm real antes de crear el flujo final.

# KC-01 · Subir Keycloak a 26.7.5 (parche, sin down -v)

- Estado: Pendiente
- Prioridad: Media
- Parte del lab: keycloak
- Depende de: —
- Fecha: 2026-09-30
- Contexto: El contenedor de Keycloak debe mantenerse en una versión parche más reciente para reducir riesgos de seguridad y permanecer alineado con la documentación oficial del lab. La actualización debe hacerse sin destruir el volumen persistente de datos.
- Criterio de aceptación:
  - `docker compose -f keycloak/compose.yaml config` muestra la imagen `quay.io/keycloak/keycloak:26.7.5` en la configuración del servicio.
  - `docker compose -f keycloak/compose.yaml up -d` levanta Keycloak con la nueva versión y sin `docker compose down -v`.
  - `curl http://localhost:8080/realms/master/protocol/openid-connect/auth` responde con la pantalla de autenticación de Keycloak.
- Archivos relevantes:
  - keycloak/compose.yaml
  - keycloak/.env.example
- Notas:
  - Confirmado: la actualización es parche y no debe destruir el volumen persistente.
  - Inferido: la imagen debe mantenerse en `127.0.0.1:8080` para no cambiar el flujo del laboratorio.
  - Pendiente: verificar el comportamiento exacto del realm lab tras el parche.

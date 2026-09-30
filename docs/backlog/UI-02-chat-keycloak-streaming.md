# UI-02 · Chat con login de Keycloak y streaming (C.3–C.4)

- Estado: En curso
- Prioridad: Alta
- Parte del lab: C.3–C.4
- Depende de: KC-02, UI-01
- Fecha: 2026-09-30
- Contexto: La UI del chat debe soportar autenticación de Keycloak y un flujo de streaming para mostrar respuestas del agente en tiempo real. Esto mejora la experiencia del usuario y la integración con la seguridad del lab.
- Criterio de aceptación:
  - `curl -s http://localhost:5173` o la URL equivalente del frontend devuelve el documento HTML del chat con el login del flujo de navegador.
  - La consola del navegador registra `token` presente en la sesión al iniciar con `ana` y la respuesta del agente llega con streaming.
  - `grep -R "EventSource\|stream\|Authorization\|Bearer" kc-front/src/app agents` confirma los puntos de integración de streaming y token.
- Archivos relevantes:
  - kc-front/src/app/
  - agents/
- Notas:
  - Confirmado: la autenticación final debe pasar por Keycloak.
  - Inferido: el streaming puede usarse para respuestas intermedias del agente o del A2A.
  - Pendiente: validar la URL final del puerto real de la UI y del endpoint del orquestador.

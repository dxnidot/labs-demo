# UI-01 · API server de ADK en :8010 (C.2)

- Estado: Hecho
- Prioridad: Alta
- Parte del lab: C.2
- Depende de: AG-01
- Fecha: 2026-09-30
- Contexto: La API de ADK debe exponerse con una ruta estable para que la interfaz de Lara y otros clientes puedan pedir un flujo de conversación, streaming o llamadas a herramienta sin acoplarse al runner local del orquestador.
- Criterio de aceptación:
  - `curl http://localhost:8010/health` devuelve `200` y una respuesta JSON con el estado del servicio.
  - `curl http://localhost:8010/openapi.json` o la ruta equivalente del servidor devuelve la especificación del API.
  - `grep -R "8010\|adk.*server\|health" agents` confirma la ruta y la configuración del puerto del servicio.
- Archivos relevantes:
  - agents/
  - docs/backlog/
- Notas:
  - Confirmado: el puerto debe ser estable para no romper el flujo del laboratorio.
  - Inferido: el servicio debe ser el punto de integración entre ADK y la UI.
  - Confirmado: adk api_server escucha en 127.0.0.1:8010; rutas de sesión y run_sse tomadas del OpenAPI local.
  - Cerrado: 2026-09-30.

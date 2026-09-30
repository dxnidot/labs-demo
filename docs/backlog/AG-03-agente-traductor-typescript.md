# AG-03 · Agente traductor en TypeScript (A2A, pregunta y responde) en :8003

- Estado: Pendiente
- Prioridad: Media
- Parte del lab: B.3
- Depende de: AG-01
- Fecha: 2026-09-30
- Contexto: La traducción ocasional se delega a un agente especializado que responde al orquestador por A2A.
- Criterio de aceptación:
  - `curl http://localhost:8003/.well-known/agent-card.json` devuelve una card cuyo name es `traductor` y describe su función de traducción.
  - `cd agents/traductor-ts && npm test -- --run` pasa pruebas de traducción y respuesta A2A.
  - Una solicitud de traducción se resuelve por pregunta/respuesta; no cambia el contenido original fuera de la traducción solicitada.
- Archivos relevantes:
  - agents/traductor-ts/
  - agents/orquestador/
- Notas:
  - Confirmado: la implementación debe validar si ADK TypeScript soporta A2A de forma nativa o si requiere el SDK oficial de A2A para JavaScript.
  - Inferido: la ultima versión del paquete del SDK puede cambiar el nombre del servicio o del endpoint.
  - Pendiente: revisar si ADK TypeScript expone agent cards con la misma convención del resto del laboratorio y probar la traducción.

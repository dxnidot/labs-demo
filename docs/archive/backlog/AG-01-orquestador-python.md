# AG-01 · Orquestador Python en adk web (B.1)

- Estado: Hecho
- Prioridad: Alta
- Parte del lab: B.1
- Depende de: AG-00
- Fecha: 2026-09-30
- Contexto: El orquestador es la pantalla principal del laboratorio: recibe al usuario, decide qué agente dispara y mantiene la conversación con un modelo configurable. Debe levantarse con el entorno limpio y con una regla muy clara de dominio.
- Criterio de aceptación:
  - `cd agents && .\.venv\Scripts\Activate.ps1` seguido de `adk web` arranca la interfaz del orquestador en http://localhost:8000.
  - Una interacción simple con el modelo devuelve un texto en español y con una respuesta breve y directa.
  - Un `tool` simple del agente (por ejemplo, hora por zona horaria) puede invocarse y producir una respuesta verificable en la UI del orquestador.
- Archivos relevantes:
  - agents/orquestador/
  - agents/.venv/
- Notas:
  - Confirmado: el orquestador es la entrada principal del laboratorio.
  - Inferido: `temperature=0.2` ayuda a respuestas más predecibles.
  - Confirmado: LiteLlm con el modelo deepseek/deepseek-flash funciona en adk web.
  - Cerrado: 2026-09-30.

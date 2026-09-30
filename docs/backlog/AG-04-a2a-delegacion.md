# AG-04 · Orquestador delega a cálculos financieros y traducción (B.4)

- Estado: Pendiente
- Prioridad: Media
- Parte del lab: B.4
- Depende de: AG-02, AG-03
- Fecha: 2026-09-30
- Contexto: El orquestador delega cálculos financieros y traducciones a agentes especializados por A2A, eligiendo el patrón de colaboración según la tarea.
- Criterio de aceptación:
  - `grep -R "delegate\|transfer\|routing\|A2A\|question-answer" agents` demuestra la lógica de delegación entre agentes.
  - Las operaciones se transfieren a `calculos-financieros` para que el resultado numérico determinista llegue sin reescritura del orquestador.
  - Las solicitudes de traducción se dirigen a `traductor` mediante pregunta/respuesta, manteniendo al orquestador a cargo de la conversación.
  - Pruebas verifican ambos destinos y los patrones de colaboración elegidos.
- Archivos relevantes:
  - agents/
  - docs/backlog/
- Notas:
  - Confirmado: la delegación por A2A conecta el orquestador con los agentes de cálculos financieros y traducción.
  - Inferido: el orquestador solo debe decidir el paso, no repetir la lógica del negocio de los agentes.
  - Pendiente: validar la forma precisa del payload A2A en la versión final del SDK.

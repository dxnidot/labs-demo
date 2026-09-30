# AG-02 · Agente aclaraciones en Java con A2A :8002 (B.2)

- Estado: Pendiente
- Prioridad: Media
- Parte del lab: B.2
- Depende de: AG-01
- Fecha: 2026-09-30
- Contexto: El flujo de aclaraciones debe ejecutarse en un agente determinista para evitar que el modelo decida la logística del proceso. Esto mejora la predictibilidad y reduce el riesgo de decisiones erróneas cuando hay dinero involucrado.
- Criterio de aceptación:
  - `curl http://localhost:8002/.well-known/agent-card.json` devuelve una card con name "aclaraciones" y su descripción.
  - `cd agents/aclaraciones-java && mvn test` pasa las pruebas de validarTarjeta, registrarAclaracion y devolverFolio.
  - Una solicitud de aclaración devuelve un folio con formato `ACL-####` y los pasos se ejecutan siempre en el mismo orden (lo decide el workflow, no el modelo).
- Archivos relevantes:
  - agents/aclaraciones-java/
  - agents/orquestador/
- Notas:
  - Confirmado: el flujo debe ser determinista y ordenado.
  - Inferido: la versión final del SDK de ADK Java puede exigir una estructura exacta para la agent card.
  - Pendiente: validar la compatibilidad del conector de modelo y la versión exacta de la dependencia).

# AG-02 · Agente de cálculos financieros en Java (A2A, sin LLM)

- Estado: Pendiente
- Prioridad: Media
- Parte del lab: B.2
- Depende de: AG-01
- Fecha: 2026-09-30
- Contexto: Los cálculos financieros deben ejecutarse de forma determinista en Java, sin delegar operaciones numéricas al LLM.
- Criterio de aceptación:
  - `curl http://localhost:8002/.well-known/agent-card.json` devuelve una card cuyo name es `calculos-financieros`.
  - `cd agents/calculos-financieros-java && mvn test` pasa pruebas JUnit de proyección de gastos fijos, costo estimado de pagar el mínimo frente al total de la tarjeta y porcentaje del sueldo comprometido en gastos fijos.
  - Cada prueba verifica resultados esperados calculados a mano; ningún cálculo depende del LLM.
- Archivos relevantes:
  - agents/calculos-financieros-java/
  - agents/orquestador/
- Notas:
  - Confirmado: los cálculos deben ser deterministas y no usan LLM.
  - Inferido: la versión final del SDK de ADK Java puede exigir una estructura exacta para la agent card.
  - Pendiente: validar la versión exacta de la dependencia y la forma de exponer la agent card.

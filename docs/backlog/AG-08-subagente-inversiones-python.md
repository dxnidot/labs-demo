# AG-08 · Subagente inversiones en Python (ADK, dentro del orquestador)

- Estado: Pendiente
- Prioridad: Media
- Parte del lab: agents (ADK)
- Depende de: FIN-10, FIN-04
- Fecha: 2026-09-30
- Contexto: Añadir al orquestador un subagente que atienda preguntas de inversión y consulte las funciones de finanzas mediante herramientas que delegan los cálculos al servicio.
- Criterio de aceptación:
  - El subagente tiene instrucciones con las reglas de trabajo de inversión.
  - Expone las tools `consultar_portafolio`, `simular_aportacion` y `alertas_caida`, conectadas al servicio `finanzas/`.
  - El orquestador transfiere al subagente las preguntas de inversión.
  - El LLM recibe resultados calculados, no datos reales innecesarios ni lógica de cálculo financiero.
- Archivos relevantes: `agents/`, `finanzas/`
- Notas:
  - Confirmado: las dependencias declaradas son FIN-10 y FIN-04.
  - Pendiente: comprobar los cambios tras su aprobación.

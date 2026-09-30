# ADR-0005: Enfoque de finanzas personales

- Contexto: El laboratorio necesita un propósito principal claro para Lara, con privacidad adecuada para datos financieros personales.
- Decisión:
  - Lara será una asistente de finanzas personales para revisar gastos, gastos fijos frente al sueldo, proyecciones e inversiones; ofrecerá recomendaciones educativas, por ejemplo, explicar el costo de pagar el mínimo frente al total de una tarjeta de crédito. La traducción será ocasional.
  - Lara incluirá vistas para inspeccionar memoria, base de datos, agentes y herramientas.
  - La identidad (menú por rol, bpm-sync y Authorization Services) se conserva únicamente como track de pruebas y queda en baja prioridad.
  - Se elimina del laboratorio la función de aclaraciones; el agente Java se enfocará en cálculos financieros.
  - El sueldo y las transacciones permanecen localmente en `agents/data/`. El LLM recibe solo agregados y resultados ya calculados; los cálculos se implementan en código, nunca en el LLM.
  - Las recomendaciones son educativas y no constituyen asesoría financiera personalizada.
- Alternativas consideradas: mantener identidad como caso principal; enviar movimientos al LLM para que calcule; retirar también la traducción. Se descartan para priorizar el uso personal con privacidad local, resultados numéricos reproducibles y traducción ocasional.
- Consecuencias: Lara prioriza finanzas personales y las vistas de inspección; los cálculos son verificables con pruebas deterministas. El laboratorio debe preservar los datos en disco local y separar las operaciones de cálculo de la generación de texto.
- Estado: Aceptada

# FIN-06 · Registro de ingresos (sueldo) y porcentaje del ingreso comprometido en gastos fijos

- Estado: Pendiente
- Prioridad: Media
- Parte del lab: Finanzas
- Depende de: FIN-01
- Fecha: 2026-09-30
- Contexto: Registrar el sueldo localmente y usar AG-02 para calcular qué porcentaje del ingreso mensual está comprometido en gastos fijos.
- Criterio de aceptación:
  - El sueldo se guarda en `agents/data/`, ignorado por Git, y no se envía al LLM.
  - AG-02 calcula el porcentaje con una prueba cuyo resultado esperado se calcula a mano.
  - Lara muestra el sueldo y el porcentaje sin exponer el dato a servicios externos.
- Archivos relevantes:
  - agents/data/
  - agents/
  - agents-ui/
- Notas:
  - Confirmado: el cálculo numérico corresponde al agente determinista AG-02.
  - Pendiente: acordar el formato local de captura del sueldo.

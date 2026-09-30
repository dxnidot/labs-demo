# FIN-03 · Detección de gastos fijos y proyección calculada en código (D.3)

- Estado: Pendiente
- Prioridad: Media
- Parte del lab: Finanzas
- Depende de: FIN-01
- Fecha: 2026-09-30
- Contexto: El análisis financiero identifica periódicos y gastos recurrentes para proyectar el flujo del mes. Debe hacerlo en código y no depender de fórmulas ocultas en la UI.
- Criterio de aceptación:
  - `grep -R "gasto fijo\|proyeccion\|recurrencia\|monto mensual" .` encuentra el módulo de detección y cálculo.
  - Un conjunto sintético de movimientos genera una proyección mensual verificable con reglas explícitas.
  - La app marca el gasto fijo y la varianza frente a la línea base sin ambigüedad.
- Archivos relevantes:
  - agents/
  - agents-ui/
- Notas:
  - Confirmado: el cálculo debe pensarse para datos sintéticos.
  - Inferido: la lógica del cálculo necesita reglas definidas y testeables.
  - Pendiente: definir qué considera un gasto fijo para el caso del lab antes de la versión final.

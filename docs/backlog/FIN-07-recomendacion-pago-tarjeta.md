# FIN-07 · Recomendación educativa sobre pago de tarjeta de crédito

- Estado: Pendiente
- Prioridad: Media
- Parte del lab: Finanzas
- Depende de: AG-02, FIN-06
- Fecha: 2026-09-30
- Contexto: Comparar educativamente el pago del total frente al mínimo con intereses estimados y fechas de corte y pago; AG-02 calcula los importes.
- Criterio de aceptación:
  - AG-02 calcula y prueba con valores esperados a mano el costo estimado de ambas opciones, usando saldo, tasa e información de fechas requeridos.
  - La vista explica supuestos y presenta el resultado como recomendación educativa, no asesoría financiera personalizada.
  - El LLM recibe únicamente agregados y resultados calculados; no recibe transacciones ni sueldo sin procesar.
- Archivos relevantes:
  - agents/
  - agents/data/
  - agents-ui/
- Notas:
  - Confirmado: los importes se calculan en código, no en el LLM.
  - Pendiente: definir los campos y supuestos de entrada para estimar intereses.

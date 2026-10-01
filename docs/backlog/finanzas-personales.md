# FIN-00 · Finanzas personales (épica)

- Estado: Pendiente
- Prioridad: Baja
- Parte del lab: Finanzas
- Depende de: UI-04
- Fecha: 2026-09-30
- Contexto: Lara ayuda a revisar gastos, sueldo, gastos fijos, proyecciones e inversiones con datos locales. El LLM recibe solo agregados y resultados calculados; las recomendaciones son educativas, no asesoría financiera personalizada.
- Criterio de aceptación:
  - `find . -type f | grep -Ei "finanzas|csv|xlsx|movimientos|proyeccion"` devuelve la estructura del prototipo y los archivos de ejemplo.
  - Sueldo y transacciones permanecen localmente en `agents/data/`; las operaciones numéricas se calculan en código.
  - Lara permite inspeccionar memoria, base de datos, agentes y herramientas.
  - Los resultados educativos explican sus cálculos y no se presentan como asesoría financiera personalizada.
- Archivos relevantes:
  - agents/data/
  - agents/
  - agents-ui/
- Notas:
  - Confirmado: solo se usan datos sintéticos y no se almacena información personal.
  - Inferido: la parte más compleja será la definición de reglas de clasificación y proyección.
  - Pendiente: confirmar el esquema del CSV/XLSX final y la vista que mostrará el resumen.

## Historias

- [FIN-01 · Importador xlsx/csv](FIN-01-importador-xlsx-csv.md)
- [FIN-02 · Importador de Google Takeout](FIN-02-importador-takeout.md)
- [FIN-03 · Detección de gastos fijos y proyección](FIN-03-deteccion-gastos-fijos.md)
- [FIN-04 · Importador de estado de cuenta de inversiones (PDF mensual) y valuación con precios públicos](FIN-04-importador-inversiones-pdf.md)
- [FIN-05 · Captura de cargos desde notificaciones del celular](FIN-05-notificaciones-celular.md)
- [FIN-06 · Registro de ingresos (sueldo) y porcentaje del ingreso comprometido en gastos fijos](FIN-06-registro-ingresos-sueldo.md)
- [FIN-07 · Recomendación educativa sobre pago de tarjeta de crédito](FIN-07-recomendacion-pago-tarjeta.md)
- [FIN-09 · Vista Mis tarjetas y Próximos pagos (solo lectura)](FIN-09-vista-proximos-pagos.md)
- [FIN-10 · Microservicio de tarjetas y calendario financiero](FIN-10-microservicio-finanzas.md) — Hecho
- [FIN-11 · Movimientos: gastos e ingresos](FIN-11-movimientos.md) — Hecho

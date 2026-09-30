# FIN-00 · Finanzas personales (épica)
- Estado: Pendiente
- Prioridad: Baja
- Parte del lab: Finanzas
- Depende de: UI-04
- Fecha: 2026-09-30
- Contexto: Este prototipo explora un resumen de ingresos y gastos usando datos sintéticos para probar la lógica de clasificación, proyección y revisión mensual sin exponer información personal o bancaria.
- Criterio de aceptación:
	- `find . -type f | grep -Ei "finanzas|csv|xlsx|movimientos|proyeccion"` devuelve la estructura del prototipo y los archivos de ejemplo.
	- Un conjunto sintético de movimientos produce un resumen mensual y una lista de gastos recurrentes sin errores de validación.
	- La UI marca el flujo como demo aislada y no muestra ningún dato o entidad actual de finanzas personales reales.
- Archivos relevantes:
	- docs/plans/estado-lab.md
	- docs/backlog/
	- kc-front/src/
- Notas:
	- Confirmado: solo se usan datos sintéticos y no se almacena información personal.
	- Inferido: la parte más compleja será la definición de reglas de clasificación y proyección.
	- Pendiente: confirmar el esquema del CSV/XLSX final y la vista que mostrará el resumen.

## Historias

- [FIN-01 · Importador xlsx/csv](FIN-01-importador-xlsx-csv.md)
- [FIN-02 · Importador de Google Takeout](FIN-02-importador-takeout.md)
- [FIN-03 · Detección de gastos fijos y proyección](FIN-03-deteccion-gastos-fijos.md)

# FIN-02 · Importador de Google Takeout (D.2)

- Estado: Pendiente
- Prioridad: Baja
- Parte del lab: Finanzas
- Depende de: FIN-01
- Fecha: 2026-09-30
- Contexto: La entrada de datos de Google Takeout sirve como caso realista para probar la pipeline de importación. El objetivo es validar que un extracto del usuario pueda encajar en el modelo del lab sin comprometer datos personales.
- Criterio de aceptación:
  - `find . -type f | grep -i "takeout"` encuentra el módulo o archivo de prueba del importador.
  - Un archivo sintético con estructura Takeout se procesa y normaliza a los campos del proyecto.
  - La app detalla qué columnas se mapean y qué filas quedaron rechazadas.
- Archivos relevantes:
  - docs/
  - kc-front/src/
- Notas:
  - Confirmado: el importador debe ser un caso de prueba, no una integración con cuentas reales.
  - Inferido: hay que mapear columnas de forma explícita para evitar errores de contenido.
  - Pendiente: decidir si el caso requiere anotaciones de negocio o un proceso más general de normalización.

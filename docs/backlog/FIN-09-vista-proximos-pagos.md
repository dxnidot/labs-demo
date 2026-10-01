# FIN-09 · Vista Próximos pagos en Lara (cortes y pagos de tarjetas)

- Estado: Pendiente
- Prioridad: Media
- Parte del lab: C.5
- Depende de: FIN-10
- Fecha: 2026-09-30
- Contexto: Mostrar en Lara los cortes y pagos de tarjetas de los próximos 30 días consultando el calendario del microservicio finanzas.
- Criterio de aceptación:
  - La vista de `agents-ui` consulta `GET /api/finanzas/calendario` para los próximos 30 días.
  - La consulta usa el Bearer token actualizado por la autenticación de Lara.
  - Los eventos CORTE y PAGO se agrupan por fecha.
  - Cuando no hay eventos, la vista muestra un estado vacío.
  - Una prueba Vitest valida la vista usando un adaptador falso.
- Archivos relevantes:
  - agents-ui/
  - finanzas/
- Notas:
  - Confirmado: FIN-10 proporciona el endpoint autenticado de calendario.
  - Pendiente: el manejo de fines de semana y feriados no forma parte de la vista.

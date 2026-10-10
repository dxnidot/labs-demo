/** Pago recurrente detectado en los movimientos; confirmados y por confirmar. */
export interface GastoFijoDetectado {
  id: string;
  concepto: string;
  dia: number;
  monto: number;
  origen: string;
  confirmado: boolean;
}

/** Proyección de un mes del calendario de gastos fijos, calculada en código (nunca por el LLM). */
export interface ProyeccionMensual {
  /** Etiqueta corta del mes, p. ej. "oct". */
  mes: string;
  total: number;
  /** El mes más alto de la proyección; se resalta con el token chart-4. */
  esPico: boolean;
  explicacion?: string;
}

/** Gasto recurrente detectado o confirmado por Lara. */
export interface GastoFijoDetectado {
  id: string;
  concepto: string;
  dia: number;
  monto: number;
  origen: string;
  confirmado: boolean;
}

/** Total estimado de un mes dentro de la proyección de gastos fijos. */
export interface ProyeccionMensual {
  mes: string;
  total: number;
  esPico: boolean;
  explicacion?: string;
}

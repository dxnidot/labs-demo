/**
 * Movimiento financiero ya clasificado por el servicio de finanzas.
 * @author Daniel
 * @since 2026-09-30
 */
export interface MovimientoFinanciero {
  id: string;
  fecha: string;
  monto: number;
  moneda: Moneda;
  comercio: string;
  categoria: string;
  tarjetaId: string | null;
  origen: OrigenMovimiento;
  tipo: TipoMovimiento;
}

/**
 * Importe de una categoría calculado por finanzas para un tipo y moneda.
 * @author Daniel
 * @since 2026-09-30
 */
export interface ResumenCategoriaFinanciera {
  categoria: string;
  tipo: TipoMovimiento;
  moneda: Moneda;
  total: number;
}

/** Monedas admitidas para movimientos financieros. */
export type Moneda = "MXN" | "USD";

/** Tipos de movimiento clasificados por finanzas. */
export type TipoMovimiento = "GASTO" | "INGRESO";

/** Canales de origen admitidos por la API financiera. */
export type OrigenMovimiento = "MANUAL" | "IMPORT" | "NOTIFICACION";

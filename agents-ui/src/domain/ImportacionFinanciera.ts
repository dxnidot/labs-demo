import type { Moneda, TipoMovimiento } from "./MovimientoFinanciero";

/**
 * Fila financiera validada por el servicio al previsualizar un archivo CSV.
 * @author Daniel
 * @since 2026-09-30
 */
export interface MovimientoImportacion {
  fecha: string;
  monto: number;
  moneda: Moneda;
  comercio: string;
  categoria: string;
  tarjetaId: string | null;
  tipo: TipoMovimiento;
}

/**
 * Previsualización que debe confirmarse expresamente para importar movimientos.
 * @author Daniel
 * @since 2026-09-30
 */
export interface PreviewImportacion {
  importId: string;
  totalRegistros: number;
  movimientos: MovimientoImportacion[];
}

/**
 * Resultado de confirmar una importación CSV.
 * @author Daniel
 * @since 2026-09-30
 */
export interface ResultadoImportacion {
  totalRegistros: number;
}

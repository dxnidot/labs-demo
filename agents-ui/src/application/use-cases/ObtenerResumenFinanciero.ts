import type {
  MovimientoFinanciero,
  ResumenCategoriaFinanciera,
} from "../../domain/MovimientoFinanciero";
import type { Tarjeta } from "../../domain/Tarjeta";
import type { FinanzasPort } from "../ports/FinanzasPort";

/**
 * Respuesta de lectura del panel, compuesta con resultados del servicio.
 * @author Daniel
 * @since 2026-09-30
 */
export interface ResumenFinanciero {
  movimientos: MovimientoFinanciero[];
  resumen: ResumenCategoriaFinanciera[];
  tarjetas: Tarjeta[];
}

/**
 * Obtiene en paralelo los movimientos, el resumen calculado y las tarjetas.
 * @author Daniel
 * @since 2026-09-30
 */
export class ObtenerResumenFinanciero {
  constructor(private readonly finanzas: FinanzasPort) {}

  async ejecutar(periodo: string): Promise<ResumenFinanciero> {
    const [movimientos, resumen, tarjetas] = await Promise.all([
      this.finanzas.listarMovimientos(),
      this.finanzas.consultarResumenMensual(periodo),
      this.finanzas.listarTarjetas(),
    ]);
    return { movimientos, resumen, tarjetas };
  }
}

import type { EventoCalendario } from "../../domain/EventoCalendario";
import type {
  MovimientoFinanciero,
  ResumenCategoriaFinanciera,
} from "../../domain/MovimientoFinanciero";
import type { Tarjeta } from "../../domain/Tarjeta";
import type { FinanzasPort } from "../ports/FinanzasPort";

/** Días del calendario de cortes y pagos que consulta el panel. */
export const DIAS_CALENDARIO = 30;

/**
 * Respuesta de lectura del panel, compuesta con resultados del servicio.
 * @author Daniel
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-09-30 Incluye el calendario de cortes y pagos.
 */
export interface ResumenFinanciero {
  movimientos: MovimientoFinanciero[];
  resumen: ResumenCategoriaFinanciera[];
  tarjetas: Tarjeta[];
  eventos: EventoCalendario[];
}

/**
 * Obtiene en paralelo movimientos, resumen calculado, tarjetas y calendario.
 * @author Daniel
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-09-30 Agrega el calendario de los próximos 30 días.
 */
export class ObtenerResumenFinanciero {
  constructor(private readonly finanzas: FinanzasPort) {}

  async ejecutar(periodo: string, desde: string): Promise<ResumenFinanciero> {
    const [movimientos, resumen, tarjetas, eventos] = await Promise.all([
      this.finanzas.listarMovimientos(),
      this.finanzas.consultarResumenMensual(periodo),
      this.finanzas.listarTarjetas(),
      this.finanzas.consultarCalendario(desde, DIAS_CALENDARIO),
    ]);
    return { movimientos, resumen, tarjetas, eventos };
  }
}

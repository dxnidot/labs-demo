import type { EventoCalendario } from "../../domain/EventoCalendario";
import type { Tarjeta } from "../../domain/Tarjeta";
import type { FinanzasPort } from "../ports/FinanzasPort";

export interface PagosData {
  tarjetas: Tarjeta[];
  eventos: EventoCalendario[];
}

/**
 * Obtiene en paralelo tarjetas y eventos ya calculados para el calendario.
 * @author Daniel
 * @since 2026-09-30
 */
export class ObtenerPagos {
  constructor(private readonly finanzas: FinanzasPort) {}

  async ejecutar(desde: string): Promise<PagosData> {
    const [tarjetas, eventos] = await Promise.all([
      this.finanzas.listarTarjetas(),
      this.finanzas.consultarCalendario(desde, 30),
    ]);
    return { tarjetas, eventos };
  }
}

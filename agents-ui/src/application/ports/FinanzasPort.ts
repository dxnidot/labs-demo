import type { EventoCalendario } from "../../domain/EventoCalendario";
import type { Tarjeta } from "../../domain/Tarjeta";

/**
 * Define las consultas de tarjetas y calendario y el cambio de estado.
 * @author Daniel
 * @since 2026-09-30
 */
export interface FinanzasPort {
  listarTarjetas(): Promise<Tarjeta[]>;
  consultarCalendario(desde: string, dias: number): Promise<EventoCalendario[]>;
  actualizarTarjeta(tarjeta: Tarjeta): Promise<Tarjeta>;
}

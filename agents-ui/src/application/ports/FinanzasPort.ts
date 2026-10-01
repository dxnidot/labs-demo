import type { EventoCalendario } from "../../domain/EventoCalendario";
import type {
  MovimientoFinanciero,
  ResumenCategoriaFinanciera,
} from "../../domain/MovimientoFinanciero";
import type { Tarjeta } from "../../domain/Tarjeta";
import type {
  PreviewImportacion,
  ResultadoImportacion,
} from "../../domain/ImportacionFinanciera";

/**
 * Define las consultas financieras disponibles para las vistas de Lara.
 * @author Daniel
 * @since 2026-09-30
 * @modified Daniel 2026-09-30 Agrega operaciones autenticadas de importación CSV.
 */
export interface FinanzasPort {
  listarTarjetas(): Promise<Tarjeta[]>;
  listarMovimientos(): Promise<MovimientoFinanciero[]>;
  consultarResumenMensual(periodo: string): Promise<ResumenCategoriaFinanciera[]>;
  consultarCalendario(desde: string, dias: number): Promise<EventoCalendario[]>;
  actualizarTarjeta(tarjeta: Tarjeta): Promise<Tarjeta>;
  previsualizarImportacion(archivo: File): Promise<PreviewImportacion>;
  confirmarImportacion(importId: string): Promise<ResultadoImportacion>;
}

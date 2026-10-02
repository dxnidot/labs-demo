import type { Modelo } from "../../domain/Modelo";

/**
 * Define la consulta de los modelos de LLM disponibles para el usuario.
 * @author Daniel Tovar
 * @since 2026-10-01
 */
export interface ModeloPort {
  listarDisponibles(): Promise<Modelo[]>;
}

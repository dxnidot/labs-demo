import type { ColeccionMemoria, ResultadoMemoria } from "../../domain/ResultadoMemoria";

/** Define las consultas de colecciones y búsqueda semántica disponibles para la vista de memoria.
 * @author Daniel Tovar
 * @since 2026-10-10
 */
export interface MemoriaPort {
  listarColecciones(): Promise<ColeccionMemoria[]>;
  buscar(consulta: string, coleccion?: string): Promise<ResultadoMemoria[]>;
}

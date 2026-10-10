import type { ColeccionMemoria, ResultadoMemoria } from "../../domain/ResultadoMemoria";

/** Búsqueda semántica en la memoria vectorizada: documentación y recuerdos de sesión. */
export interface MemoriaPort {
  listarColecciones(): Promise<ColeccionMemoria[]>;
  buscar(consulta: string, coleccion?: string): Promise<ResultadoMemoria[]>;
}

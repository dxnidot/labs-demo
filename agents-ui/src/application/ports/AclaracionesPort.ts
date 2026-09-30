import type { Aclaracion } from "../../domain/Aclaracion";
import type { ResultadoAprobacion } from "../../domain/ResultadoAprobacion";

/**
 * Define la consulta y aprobación de aclaraciones.
 * @author Daniel
 * @since 2026-09-30
 */
export interface AclaracionesPort {
  obtenerAclaraciones(): Promise<Aclaracion[]>;
  aprobarAclaracion(id: number): Promise<ResultadoAprobacion>;
}

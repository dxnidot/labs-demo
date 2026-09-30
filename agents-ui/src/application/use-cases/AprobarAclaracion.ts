import type { AclaracionesPort } from "../ports/AclaracionesPort";
import type { ResultadoAprobacion } from "../../domain/ResultadoAprobacion";

/**
 * Solicita al backend aprobar la aclaración identificada.
 * @author Daniel
 * @since 2026-09-30
 */
export class AprobarAclaracion {
  constructor(private readonly aclaraciones: AclaracionesPort) {}

  ejecutar(id: number): Promise<ResultadoAprobacion> {
    return this.aclaraciones.aprobarAclaracion(id);
  }
}

import type { AclaracionesPort } from "../ports/AclaracionesPort";
import type { Aclaracion } from "../../domain/Aclaracion";

/**
 * Obtiene las aclaraciones devueltas por el backend.
 * @author Daniel
 * @since 2026-09-30
 */
export class ObtenerAclaraciones {
  constructor(private readonly aclaraciones: AclaracionesPort) {}

  ejecutar(): Promise<Aclaracion[]> {
    return this.aclaraciones.obtenerAclaraciones();
  }
}

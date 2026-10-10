import type { ModeloPort } from "../ports/ModeloPort";
import type { Modelo } from "../../domain/Modelo";

/**
 * Obtiene los modelos de LLM que el backend autorizó para el usuario.
 * @author Daniel Tovar
 * @since 2026-10-01
 */
export class ListarModelos {
  constructor(private readonly modelos: ModeloPort) {}

  ejecutar(): Promise<Modelo[]> {
    return this.modelos.listarDisponibles();
  }
}

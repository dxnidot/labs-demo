import type { AgentePort } from "../ports/AgentePort";
import type { SesionChat } from "../../domain/SesionChat";

/**
 * Lista las sesiones del usuario en el servidor ADK (todos los orígenes).
 * @author Daniel Tovar
 * @since 2026-09-30
 */
export class ListarSesiones {
  constructor(private readonly agente: AgentePort) {}

  ejecutar(userId: string): Promise<SesionChat[]> {
    return this.agente.listarSesiones(userId);
  }
}

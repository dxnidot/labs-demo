import type { AuthPort } from "../ports/AuthPort";
import type { OrigenSesion } from "../../domain/SesionChat";
import type { AgentePort, ActualizacionStreaming } from "../ports/AgentePort";

/**
 * Envía un mensaje autenticado y crea una sesión cuando hace falta.
 * @author Daniel
 * @since 2026-09-30
 * @modified Daniel 2026-09-30 Guarda el primer mensaje como título de sesión.
 * @modified Daniel Tovar 2026-09-30 Acepta el origen opcional de la sesión nueva.
 * @modified Daniel Tovar 2026-10-01 Recibe el modeloId elegido y lo reenvía al agente.
 */
export class EnviarMensaje {
  constructor(
    private readonly auth: AuthPort,
    private readonly agente: AgentePort,
  ) {}

  async ejecutar(
    texto: string,
    sessionId: string | null,
    onUpdate: (update: ActualizacionStreaming) => void,
    modeloId: string,
    origen?: OrigenSesion,
  ): Promise<string> {
    const usuario = this.auth.usuarioActual();
    if (!usuario) {
      throw new Error("No hay un usuario autenticado para enviar el mensaje.");
    }

    const activeSessionId =
      sessionId ?? await this.agente.crearSesion(usuario.id, texto.trim().slice(0, 60), origen);
    await this.agente.enviarMensaje(
      { userId: usuario.id, sessionId: activeSessionId, texto, modeloId },
      onUpdate,
    );
    return activeSessionId;
  }
}

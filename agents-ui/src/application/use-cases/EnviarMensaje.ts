import type { AuthPort } from "../ports/AuthPort";
import type { AgentePort, ActualizacionStreaming } from "../ports/AgentePort";

/**
 * Envía un mensaje autenticado y crea una sesión cuando hace falta.
 * @author Daniel
 * @since 2026-09-30
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
  ): Promise<string> {
    const usuario = this.auth.usuarioActual();
    if (!usuario) {
      throw new Error("No hay un usuario autenticado para enviar el mensaje.");
    }

    const activeSessionId = sessionId ?? await this.agente.crearSesion(usuario.id);
    await this.agente.enviarMensaje(
      { userId: usuario.id, sessionId: activeSessionId, texto },
      onUpdate,
    );
    return activeSessionId;
  }
}

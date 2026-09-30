export type ActualizacionStreaming =
  | { tipo: "texto"; operacion: "agregar" | "reemplazar"; texto: string }
  | { tipo: "herramienta"; nombre: string };

/**
 * Define las operaciones de sesión y conversación con el agente.
 * @author Daniel
 * @since 2026-09-30
 */
export interface AgentePort {
  crearSesion(userId: string): Promise<string>;
  enviarMensaje(
    input: { userId: string; sessionId: string; texto: string },
    onUpdate: (update: ActualizacionStreaming) => void,
  ): Promise<void>;
}

import type { Mensaje } from "../../domain/Mensaje";
import type { SesionChat } from "../../domain/SesionChat";

export type ActualizacionStreaming =
  | { tipo: "texto"; operacion: "agregar" | "reemplazar"; texto: string }
  | { tipo: "herramienta"; nombre: string };

/**
 * Define las operaciones de sesión y conversación con el agente.
 * @author Daniel
 * @since 2026-09-30
 * @modified Daniel 2026-09-30 Agrega lectura del historial de sesiones.
 */
export interface AgentePort {
  crearSesion(userId: string): Promise<string>;
  listarSesiones(userId: string): Promise<SesionChat[]>;
  obtenerSesion(userId: string, sessionId: string): Promise<Mensaje[]>;
  enviarMensaje(
    input: { userId: string; sessionId: string; texto: string },
    onUpdate: (update: ActualizacionStreaming) => void,
  ): Promise<void>;
}

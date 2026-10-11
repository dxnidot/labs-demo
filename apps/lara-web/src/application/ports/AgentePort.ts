import type { Mensaje } from "../../domain/Mensaje";
import type { OrigenSesion, SesionChat } from "../../domain/SesionChat";

export type ActualizacionStreaming =
  | { tipo: "texto"; operacion: "agregar" | "reemplazar"; texto: string }
  | { tipo: "herramienta"; nombre: string }
  /** El orquestador transfiere el control o pregunta a otro agente (separador A2A en el chat). */
  | { tipo: "a2a"; origen: string; destino: string; modo: string }
  /** Paso del flujo determinista del agente delegado; completado=true se muestra con check. */
  | { tipo: "paso"; clave: string; nombre: string; completado: boolean };

/**
 * Define las operaciones de sesión y conversación con el agente.
 * @author Daniel
 * @since 2026-09-30
 * @modified Daniel 2026-09-30 Agrega lectura del historial y título inicial de sesión.
 * @modified Daniel Tovar 2026-09-30 Permite marcar el origen de la sesión (chat o finanzas).
 * @modified Daniel Tovar 2026-10-01 Agrega modeloId para elegir el LLM que atiende el mensaje.
 * @modified Daniel Tovar 2026-10-10 ActualizacionStreaming admite eventos A2A y pasos del flujo determinista.
 */
export interface AgentePort {
  crearSesion(userId: string, titulo: string, origen?: OrigenSesion): Promise<string>;
  listarSesiones(userId: string): Promise<SesionChat[]>;
  obtenerSesion(userId: string, sessionId: string): Promise<Mensaje[]>;
  enviarMensaje(
    input: { userId: string; sessionId: string; texto: string; modeloId: string },
    onUpdate: (update: ActualizacionStreaming) => void,
  ): Promise<void>;
}

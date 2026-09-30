import type { Mensaje } from "../../domain/Mensaje";
import type { SesionChat } from "../../domain/SesionChat";

type Registro = Record<string, unknown>;

function esRegistro(value: unknown): value is Registro {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function leerPartesConTexto(content: unknown): Registro[] {
  if (!esRegistro(content) || !Array.isArray(content.parts)) {
    return [];
  }
  return content.parts.filter(
    (part): part is Registro =>
      esRegistro(part) && part.thought !== true && typeof part.text === "string",
  );
}

function leerTexto(content: unknown): string {
  return leerPartesConTexto(content)
    .map((part) => part.text)
    .filter((text): text is string => typeof text === "string")
    .join("");
}

function leerFecha(value: unknown, fallbackSeconds: number): Date {
  const seconds =
    typeof value === "number" && Number.isFinite(value) ? value : fallbackSeconds;
  return new Date(seconds * 1000);
}

function esMensajeUsuario(event: Registro, content: unknown): boolean {
  return (
    (esRegistro(content) && content.role === "user") ||
    event.author === "user"
  );
}

function crearMensaje(
  rol: Mensaje["rol"],
  texto: string,
  fecha: Date,
): Mensaje {
  return { rol, texto, fecha };
}

/**
 * Convierte los eventos ADK de una sesión a mensajes visibles de la conversación.
 * @author Daniel
 * @since 2026-09-30
 */
export function mapearEventosSesion(
  events: unknown,
  lastUpdateTime = 0,
): Mensaje[] {
  if (!Array.isArray(events)) {
    return [];
  }

  const mensajes: Mensaje[] = [];
  let parcialesAgente = "";
  let fechaParcial: Date | null = null;

  for (const value of events) {
    if (!esRegistro(value)) {
      continue;
    }

    const texto = leerTexto(value.content);
    if (texto.length === 0) {
      continue;
    }

    const fecha = leerFecha(value.timestamp, lastUpdateTime);
    if (esMensajeUsuario(value, value.content)) {
      if (parcialesAgente.length > 0 && fechaParcial) {
        mensajes.push(crearMensaje("agente", parcialesAgente, fechaParcial));
        parcialesAgente = "";
        fechaParcial = null;
      }
      mensajes.push(crearMensaje("usuario", texto, fecha));
      continue;
    }

    if (value.partial === true) {
      parcialesAgente += texto;
      fechaParcial ??= fecha;
      continue;
    }

    mensajes.push(crearMensaje("agente", texto, fecha));
    parcialesAgente = "";
    fechaParcial = null;
  }

  if (parcialesAgente.length > 0 && fechaParcial) {
    mensajes.push(crearMensaje("agente", parcialesAgente, fechaParcial));
  }
  return mensajes;
}

function truncarTitulo(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > 64 ? `${normalized.slice(0, 61)}…` : normalized;
}

/**
 * Mapea, filtra y ordena las sesiones ADK que tienen un mensaje del usuario.
 * @author Daniel
 * @since 2026-09-30
 */
export function mapearSesiones(value: unknown): SesionChat[] {
  if (!Array.isArray(value)) {
    throw new Error("El servidor ADK devolvió una lista de sesiones inválida.");
  }

  return value
    .filter(esRegistro)
    .flatMap((session): SesionChat[] => {
      if (typeof session.id !== "string") {
        return [];
      }

      const eventos = mapearEventosSesion(session.events, numberOrZero(session.lastUpdateTime));
      const primerMensaje = eventos.find((mensaje) => mensaje.rol === "usuario");
      if (!primerMensaje) {
        return [];
      }

      return [{
        id: session.id,
        titulo: truncarTitulo(primerMensaje.texto),
        actualizado: leerFecha(session.lastUpdateTime, 0),
      }];
    })
    .sort((first, second) => second.actualizado.getTime() - first.actualizado.getTime());
}

function numberOrZero(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

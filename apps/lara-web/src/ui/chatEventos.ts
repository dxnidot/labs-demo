import type { ActualizacionStreaming } from "../application/ports/AgentePort";
import type { Mensaje } from "../domain/Mensaje";

/** Índice del último mensaje "evento"; -1 si no hay ninguno (el target sigue en ES2022, sin findLastIndex). */
function ultimoIndiceDeEvento(mensajes: Mensaje[]): number {
  for (let i = mensajes.length - 1; i >= 0; i -= 1) {
    if (mensajes[i].rol === "evento") {
      return i;
    }
  }
  return -1;
}

/**
 * Aplica un fragmento "paso" al último mensaje "evento" de la conversación (lo agrega o, si ya
 * existe esa clave, actualiza su estado completado). Sin un evento previo no hace nada: un paso
 * suelto sin delegación A2A no tiene dónde mostrarse.
 */
export function agregarOActualizarPaso(
  mensajes: Mensaje[],
  paso: Extract<ActualizacionStreaming, { tipo: "paso" }>,
): Mensaje[] {
  const indice = ultimoIndiceDeEvento(mensajes);
  if (indice === -1) {
    return mensajes;
  }

  const pasosActuales = mensajes[indice].pasos ?? [];
  const yaExiste = pasosActuales.some((actual) => actual.clave === paso.clave);
  const pasos = yaExiste
    ? pasosActuales.map((actual) =>
        actual.clave === paso.clave ? { ...actual, completado: paso.completado } : actual,
      )
    : [...pasosActuales, { clave: paso.clave, nombre: paso.nombre, completado: paso.completado }];

  return mensajes.map((mensaje, i) => (i === indice ? { ...mensaje, pasos } : mensaje));
}

/**
 * Aplica un fragmento "texto" al último mensaje si ya es del agente, o crea uno nuevo si el último
 * mensaje es un evento A2A o del usuario (p. ej. la respuesta final tras una delegación).
 */
export function agregarOActualizarTexto(
  mensajes: Mensaje[],
  actualizacion: Extract<ActualizacionStreaming, { tipo: "texto" }>,
): Mensaje[] {
  const ultimo = mensajes.at(-1);
  if (ultimo?.rol === "agente") {
    return mensajes.map((mensaje, index) =>
      index === mensajes.length - 1
        ? {
            ...mensaje,
            texto:
              actualizacion.operacion === "agregar"
                ? mensaje.texto + actualizacion.texto
                : actualizacion.texto,
          }
        : mensaje,
    );
  }
  return [...mensajes, { rol: "agente", texto: actualizacion.texto, fecha: new Date() }];
}

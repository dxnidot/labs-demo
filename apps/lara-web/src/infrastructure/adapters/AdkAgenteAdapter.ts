import type { AuthPort } from "../../application/ports/AuthPort";
import type { AgentePort, ActualizacionStreaming } from "../../application/ports/AgentePort";
import type { Mensaje } from "../../domain/Mensaje";
import type { OrigenSesion, SesionChat } from "../../domain/SesionChat";
import { ApiHttpClient } from "./ApiHttpClient";
import { mapearEventosSesion, mapearSesiones } from "./sesiones";
import { procesarStreamSse } from "./sse";

async function* decodificarChunks(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): AsyncGenerator<string> {
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    yield decoder.decode(value, { stream: true });
  }
  const remaining = decoder.decode();
  if (remaining.length > 0) {
    yield remaining;
  }
}

/**
 * Adapta las sesiones ADK y su flujo SSE al puerto del agente.
 * @author Daniel
 * @since 2026-09-30
 * @modified Daniel 2026-09-30 Añade consultas de historial ADK y título de sesión.
 * @modified Daniel Tovar 2026-09-30 Marca con origen las sesiones creadas desde el panel de finanzas.
 * @modified Daniel Tovar 2026-10-01 Envía el modelo elegido en la cabecera X-LLM-Model.
 * @modified Daniel Tovar 2026-10-02 Logs de consola del modelo enviado/aceptado/rechazado.
 * @modified Daniel Tovar 2026-11-19 Reutiliza ApiHttpClient (token y errores HTTP) y cancela el stream con AbortSignal.
 */
export class AdkAgenteAdapter implements AgentePort {
  constructor(
    auth: AuthPort,
    private readonly http: ApiHttpClient = new ApiHttpClient(auth),
  ) {}

  async listarSesiones(userId: string): Promise<SesionChat[]> {
    const response = await this.solicitar(
      `/adk/apps/orquestador/users/${encodeURIComponent(userId)}/sessions`,
    );
    const sessions: unknown = await response.json();
    return mapearSesiones(sessions);
  }

  async obtenerSesion(userId: string, sessionId: string): Promise<Mensaje[]> {
    const response = await this.solicitar(
      `/adk/apps/orquestador/users/${encodeURIComponent(userId)}/sessions/${encodeURIComponent(sessionId)}`,
    );
    const session: unknown = await response.json();
    if (!esRegistro(session)) {
      throw new Error("El servidor ADK devolvió una sesión inválida.");
    }
    const lastUpdateTime =
      typeof session.lastUpdateTime === "number" ? session.lastUpdateTime : 0;
    return mapearEventosSesion(session.events, lastUpdateTime);
  }

  async crearSesion(userId: string, titulo: string, origen?: OrigenSesion): Promise<string> {
    const response = await this.http.solicitarRespuesta(
      `/adk/apps/orquestador/users/${encodeURIComponent(userId)}/sessions`,
      {
        method: "POST",
        body: JSON.stringify({
          state: origen === "finanzas" ? { titulo, origen } : { titulo },
        }),
      },
      (status) => `No se pudo crear la sesión del agente (HTTP ${status}).`,
    );

    const session: unknown = await response.json();
    if (
      typeof session !== "object" ||
      session === null ||
      !("id" in session) ||
      typeof session.id !== "string"
    ) {
      throw new Error("El servidor ADK no devolvió un identificador de sesión válido.");
    }
    return session.id;
  }

  private solicitar(url: string): Promise<Response> {
    return this.http.solicitarRespuesta(
      url,
      {},
      (status) => `No se pudo consultar el historial del agente (HTTP ${status}).`,
    );
  }

  async enviarMensaje(
    input: { userId: string; sessionId: string; texto: string; modeloId: string; signal?: AbortSignal },
    onUpdate: (update: ActualizacionStreaming) => void,
  ): Promise<void> {
    console.info(`[modelo] POST /adk/run_sse con X-LLM-Model=${input.modeloId}`);
    const response = await this.http.solicitarRespuesta(
      "/adk/run_sse",
      {
        method: "POST",
        headers: { Accept: "text/event-stream", "X-LLM-Model": input.modeloId },
        signal: input.signal,
        body: JSON.stringify({
          appName: "orquestador",
          userId: input.userId,
          sessionId: input.sessionId,
          streaming: true,
          newMessage: {
            role: "user",
            parts: [{ text: input.texto }],
          },
        }),
      },
      (status) => {
        if (status === 403) {
          console.warn(`[modelo] rechazado por el backend (model=${input.modeloId}, HTTP 403)`);
        }
        return `No se pudo enviar el mensaje al agente (HTTP ${status}).`;
      },
    );
    console.info(`[modelo] aceptado por el backend (model=${input.modeloId})`);
    if (!response.body) {
      throw new Error("El servidor ADK no devolvió el flujo de eventos.");
    }

    const reader = response.body.getReader();
    try {
      for await (const update of procesarStreamSse(decodificarChunks(reader))) {
        onUpdate(update);
      }
    } finally {
      reader.releaseLock();
    }
  }

}

function esRegistro(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

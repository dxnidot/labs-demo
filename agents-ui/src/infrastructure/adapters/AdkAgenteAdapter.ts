import type { AuthPort } from "../../application/ports/AuthPort";
import type { AgentePort, ActualizacionStreaming } from "../../application/ports/AgentePort";
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
 */
export class AdkAgenteAdapter implements AgentePort {
  constructor(private readonly auth: AuthPort) {}

  async crearSesion(userId: string): Promise<string> {
    const token = await this.auth.updateToken();
    const response = await fetch(
      `/adk/apps/orquestador/users/${encodeURIComponent(userId)}/sessions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: "{}",
      },
    );
    if (!response.ok) {
      throw new Error(`No se pudo crear la sesión del agente (HTTP ${response.status}).`);
    }

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

  async enviarMensaje(
    input: { userId: string; sessionId: string; texto: string },
    onUpdate: (update: ActualizacionStreaming) => void,
  ): Promise<void> {
    const token = await this.auth.updateToken();
    const response = await fetch("/adk/run_sse", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
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
    });
    if (!response.ok) {
      throw new Error(`No se pudo enviar el mensaje al agente (HTTP ${response.status}).`);
    }
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

import type { ActualizacionStreaming } from "../../application/ports/AgentePort";

type Registro = Record<string, unknown>;

function esRegistro(value: unknown): value is Registro {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function leerPartes(event: Registro): Registro[] {
  const content = event.content;
  if (!esRegistro(content) || !Array.isArray(content.parts)) {
    return [];
  }
  return content.parts
    .filter(esRegistro)
    .filter((part) => part.thought !== true);
}

function leerTexto(parts: Registro[]): string {
  return parts
    .map((part) => part.text)
    .filter((text): text is string => typeof text === "string")
    .join("");
}

function leerNombreHerramienta(parts: Registro[]): string | null {
  for (const part of parts) {
    for (const field of ["functionCall", "toolCall"]) {
      const call = part[field];
      if (esRegistro(call) && typeof call.name === "string" && call.name.length > 0) {
        return call.name;
      }
    }
  }
  return null;
}

function parsearEvento(data: string): Registro {
  let event: unknown;
  try {
    event = JSON.parse(data);
  } catch (cause) {
    throw new Error("El servidor ADK envió un evento SSE inválido.", { cause });
  }

  if (!esRegistro(event)) {
    throw new Error("El servidor ADK envió un evento SSE que no es un objeto.");
  }
  return event;
}

/**
 * Convierte fragmentos de red en eventos ADK y actualizaciones de chat.
 * @author Daniel
 * @since 2026-09-30
 * @modified Daniel 2026-09-30 Oculta partes de razonamiento del modelo.
 */
export async function* procesarStreamSse(
  chunks: AsyncIterable<string>,
): AsyncGenerator<ActualizacionStreaming> {
  let buffer = "";
  let dataLines: string[] = [];

  for await (const chunk of chunks) {
    buffer += chunk;
    let newline = buffer.indexOf("\n");
    while (newline >= 0) {
      const line = buffer.slice(0, newline).replace(/\r$/, "");
      buffer = buffer.slice(newline + 1);
      const data = leerLinea(line, dataLines);
      if (data !== null) {
        const update = procesarEvento(parsearEvento(data));
        if (update) {
          yield update;
        }
      }
      newline = buffer.indexOf("\n");
    }
  }

  if (buffer.length > 0) {
    const data = leerLinea(buffer.replace(/\r$/, ""), dataLines);
    if (data !== null) {
      const update = procesarEvento(parsearEvento(data));
      if (update) {
        yield update;
      }
    }
  }

  if (dataLines.length > 0) {
    const update = procesarEvento(parsearEvento(dataLines.join("\n")));
    if (update) {
      yield update;
    }
  }
}

function leerLinea(line: string, dataLines: string[]): string | null {
  if (line.length === 0) {
    if (dataLines.length === 0) {
      return null;
    }
    const data = dataLines.join("\n");
    dataLines.length = 0;
    return data;
  }
  if (line.startsWith(":")) {
    return null;
  }
  if (line.startsWith("data:")) {
    const value = line.slice(5);
    dataLines.push(value.startsWith(" ") ? value.slice(1) : value);
  }
  return null;
}

function procesarEvento(event: Registro): ActualizacionStreaming | null {
  if (
    typeof event.error === "string" ||
    typeof event.errorMessage === "string" ||
    typeof event.errorCode === "string"
  ) {
    throw new Error("El agente reportó un error durante el streaming.");
  }

  const parts = leerPartes(event);
  const text = leerTexto(parts);
  if (text.length > 0) {
    return {
      tipo: "texto",
      operacion: event.partial === true ? "agregar" : "reemplazar",
      texto: text,
    };
  }

  const toolName = leerNombreHerramienta(parts);
  if (toolName) {
    return { tipo: "herramienta", nombre: toolName };
  }
  return null;
}

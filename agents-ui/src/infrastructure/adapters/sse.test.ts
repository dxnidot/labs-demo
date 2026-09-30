import { describe, expect, it } from "vitest";
import { procesarStreamSse } from "./sse";
import type { ActualizacionStreaming } from "../../application/ports/AgentePort";

async function* chunks(...values: string[]): AsyncGenerator<string> {
  yield* values;
}

async function collect(
  source: AsyncIterable<ActualizacionStreaming>,
): Promise<ActualizacionStreaming[]> {
  const updates: ActualizacionStreaming[] = [];
  for await (const update of source) {
    updates.push(update);
  }
  return updates;
}

function textoFinal(updates: ActualizacionStreaming[]): string {
  return updates.reduce(
    (current, update) =>
      update.tipo !== "texto"
        ? current
        : update.operacion === "agregar"
          ? current + update.texto
          : update.texto,
    "",
  );
}

describe("procesarStreamSse", () => {
  it("acumula el texto de eventos parciales", async () => {
    const updates = await collect(
      procesarStreamSse(
        chunks(
          'data: {"partial":true,"content":{"parts":[{"text":"Hola "}]}}\n\n',
          'data: {"partial":true,"content":{"parts":[{"text":"mundo"}]}}\n\n',
        ),
      ),
    );

    expect(textoFinal(updates)).toBe("Hola mundo");
  });

  it("reemplaza los parciales con el evento final sin duplicar texto", async () => {
    const updates = await collect(
      procesarStreamSse(
        chunks(
          'data: {"partial":true,"content":{"parts":[{"text":"Hola "}]}}\n\n',
          'data: {"partial":false,"content":{"parts":[{"text":"Hola mundo"}]}}\n\n',
        ),
      ),
    );

    expect(textoFinal(updates)).toBe("Hola mundo");
    expect(updates.at(-1)).toEqual({
      tipo: "texto",
      operacion: "reemplazar",
      texto: "Hola mundo",
    });
  });

  it("usa el evento final aunque no haya recibido parciales", async () => {
    const updates = await collect(
      procesarStreamSse(
        chunks('data: {"partial":false,"content":{"parts":[{"text":"respuesta"}]}}\n\n'),
      ),
    );

    expect(updates).toEqual([
      { tipo: "texto", operacion: "reemplazar", texto: "respuesta" },
    ]);
  });

  it("omite thought y emite solo la parte de texto", async () => {
    const updates = await collect(
      procesarStreamSse(
        chunks(
          'data: {"content":{"parts":[{"thought":true,"text":"razonamiento"},{"text":"respuesta"}]}}\n\n',
        ),
      ),
    );

    expect(updates).toEqual([
      { tipo: "texto", operacion: "reemplazar", texto: "respuesta" },
    ]);
  });

  it("ignora eventos sin partes de texto excepto llamadas a herramientas", async () => {
    const updates = await collect(
      procesarStreamSse(
        chunks(
          'data: {"content":{"parts":[{"functionResponse":{"name":"buscar"}}]}}\n\n',
          'data: {"content":{"parts":[{"functionCall":{"name":"buscar"}}]}}\n\n',
        ),
      ),
    );

    expect(updates).toEqual([{ tipo: "herramienta", nombre: "buscar" }]);
  });

  it("expone los errores que el agente envía en el flujo", async () => {
    await expect(
      collect(procesarStreamSse(chunks('data: {"error":"falló"}\n\n'))),
    ).rejects.toThrow("El agente reportó un error durante el streaming.");
  });

  it("parsea una línea data dividida entre fragmentos de red", async () => {
    const updates = await collect(
      procesarStreamSse(
        chunks(
          'data: {"partial":true,"content":{"parts":[{"text":"resp',
          'uesta"}]}}\n\n',
        ),
      ),
    );

    expect(textoFinal(updates)).toBe("respuesta");
  });
});

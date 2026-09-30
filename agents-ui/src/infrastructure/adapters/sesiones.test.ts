import { describe, expect, it } from "vitest";
import { mapearEventosSesion, mapearSesiones } from "./sesiones";

describe("mapearEventosSesion", () => {
  it("maps user and agent events while ignoring thought and non-text events", () => {
    const mensajes = mapearEventosSesion(
      [
        {
          author: "user",
          timestamp: 1,
          content: { role: "user", parts: [{ text: "Hola" }] },
        },
        {
          author: "orquestador",
          timestamp: 2,
          content: {
            role: "model",
            parts: [
              { thought: true, text: "Razonamiento interno" },
              { functionCall: { name: "buscar" } },
              { text: "Respuesta" },
            ],
          },
        },
        {
          author: "orquestador",
          timestamp: 3,
          content: { role: "model", parts: [{ functionResponse: { name: "buscar" } }] },
        },
      ],
      4,
    );

    expect(mensajes).toEqual([
      { rol: "usuario", texto: "Hola", fecha: new Date(1000) },
      { rol: "agente", texto: "Respuesta", fecha: new Date(2000) },
    ]);
  });

  it("collapses assistant partial events into the final answer", () => {
    const mensajes = mapearEventosSesion([
      { author: "agent", timestamp: 1, partial: true, content: { parts: [{ text: "Hola " }] } },
      { author: "agent", timestamp: 2, partial: true, content: { parts: [{ text: "mundo" }] } },
      { author: "agent", timestamp: 3, partial: false, content: { parts: [{ text: "Hola mundo" }] } },
    ]);

    expect(mensajes).toEqual([
      { rol: "agente", texto: "Hola mundo", fecha: new Date(3000) },
    ]);
  });
});

describe("mapearSesiones", () => {
  it("omits sessions without user messages and sorts newest first", () => {
    const sesiones = mapearSesiones([
      {
        id: "old",
        lastUpdateTime: 10,
        events: [{ author: "user", content: { parts: [{ text: "Anterior" }] } }],
      },
      {
        id: "empty",
        lastUpdateTime: 30,
        events: [{ author: "agent", content: { parts: [{ text: "Solo agente" }] } }],
      },
      {
        id: "new",
        lastUpdateTime: 20,
        events: [{ author: "user", content: { parts: [{ text: "Más reciente" }] } }],
      },
    ]);

    expect(sesiones.map(({ id, titulo }) => ({ id, titulo }))).toEqual([
      { id: "new", titulo: "Más reciente" },
      { id: "old", titulo: "Anterior" },
    ]);
  });

  it("truncates the first user message for the session title", () => {
    const sesiones = mapearSesiones([
      {
        id: "session",
        lastUpdateTime: 1,
        events: [{ author: "user", content: { parts: [{ text: "a".repeat(80) }] } }],
      },
    ]);

    expect(sesiones[0]?.titulo).toBe(`${"a".repeat(61)}…`);
  });
});

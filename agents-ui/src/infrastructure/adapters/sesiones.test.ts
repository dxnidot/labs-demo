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
  it("usa state.titulo y conserva sesiones sin título ni eventos", () => {
    const sesiones = mapearSesiones([
      {
        id: "con-titulo",
        lastUpdateTime: 10,
        state: { titulo: "  Primer mensaje  " },
        events: [],
      },
      {
        id: "sin-titulo",
        lastUpdateTime: 30,
        events: [],
      },
    ]);

    expect(sesiones.map(({ id, titulo }) => ({ id, titulo }))).toEqual([
      { id: "sin-titulo", titulo: "Chat sin título" },
      { id: "con-titulo", titulo: "Primer mensaje" },
    ]);
  });

  it("convierte lastUpdateTime decimal en segundos a milisegundos antes de ordenar", () => {
    const sesiones = mapearSesiones([
      {
        id: "older",
        lastUpdateTime: 1.25,
        state: { titulo: "Anterior" },
      },
      {
        id: "newer",
        lastUpdateTime: 1.75,
        state: { titulo: "Más reciente" },
      },
    ]);

    expect(sesiones.map(({ id }) => id)).toEqual(["newer", "older"]);
    expect(sesiones[0]?.actualizado).toEqual(new Date(1750));
    expect(sesiones[1]?.actualizado).toEqual(new Date(1250));
  });
});

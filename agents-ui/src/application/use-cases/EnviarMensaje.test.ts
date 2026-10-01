import { describe, expect, it, vi } from "vitest";
import type { AgentePort } from "../ports/AgentePort";
import type { AuthPort } from "../ports/AuthPort";
import { EnviarMensaje } from "./EnviarMensaje";

describe("EnviarMensaje", () => {
  it("usa los primeros 60 caracteres del primer mensaje recortado como título", async () => {
    const usuario = {
      id: "usuario-1",
      username: "ana",
      roles: [],
      chatApiRoles: [],
    };
    const auth: AuthPort = {
      init: async () => usuario,
      usuarioActual: () => usuario,
      token: () => null,
      updateToken: async () => "test-token",
      logout: async () => {},
      login: async () => {},
      claimsToken: () => null,
    };
    const agente: AgentePort = {
      crearSesion: vi.fn(async () => "sesion-1"),
      listarSesiones: async () => [],
      obtenerSesion: async () => [],
      enviarMensaje: async () => {},
    };
    const enviarMensaje = new EnviarMensaje(auth, agente);

    await enviarMensaje.ejecutar(`  ${"a".repeat(65)}  `, null, () => {});

    expect(agente.crearSesion).toHaveBeenCalledWith(
      "usuario-1",
      "a".repeat(60),
      undefined,
    );
  });

  it("propaga el origen finanzas al crear la sesión", async () => {
    const usuario = { id: "usuario-1", username: "ana", roles: [], chatApiRoles: [] };
    const auth: AuthPort = {
      init: async () => usuario,
      usuarioActual: () => usuario,
      token: () => null,
      updateToken: async () => "test-token",
      logout: async () => {},
      login: async () => {},
      claimsToken: () => null,
    };
    const agente: AgentePort = {
      crearSesion: vi.fn(async () => "sesion-2"),
      listarSesiones: async () => [],
      obtenerSesion: async () => [],
      enviarMensaje: async () => {},
    };

    await new EnviarMensaje(auth, agente).ejecutar("Hola", null, () => {}, "finanzas");

    expect(agente.crearSesion).toHaveBeenCalledWith("usuario-1", "Hola", "finanzas");
  });
});

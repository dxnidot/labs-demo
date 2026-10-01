import { afterEach, describe, expect, it, vi } from "vitest";
import type { AuthPort } from "../../application/ports/AuthPort";
import { AdkAgenteAdapter } from "./AdkAgenteAdapter";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AdkAgenteAdapter", () => {
  it("envía el título en el estado inicial de la sesión", async () => {
    const auth: AuthPort = {
      init: async () => ({
        id: "usuario-1",
        username: "ana",
        roles: [],
        chatApiRoles: [],
      }),
      usuarioActual: () => null,
      token: () => null,
      updateToken: async () => "test-token",
      logout: async () => {},
      login: async () => {},
      claimsToken: () => null,
    };
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(JSON.stringify({ id: "sesion-1" })),
    );
    vi.stubGlobal("fetch", fetchMock);
    const agente = new AdkAgenteAdapter(auth);

    await expect(agente.crearSesion("usuario-1", "Primer mensaje")).resolves.toBe("sesion-1");

    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      state: { titulo: "Primer mensaje" },
    });
  });

  it("marca origen finanzas en el estado de la sesión del panel", async () => {
    const auth: AuthPort = {
      init: async () => ({ id: "usuario-1", username: "ana", roles: [], chatApiRoles: [] }),
      usuarioActual: () => null,
      token: () => null,
      updateToken: async () => "test-token",
      logout: async () => {},
      login: async () => {},
      claimsToken: () => null,
    };
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(JSON.stringify({ id: "sesion-2" })),
    );
    vi.stubGlobal("fetch", fetchMock);

    await new AdkAgenteAdapter(auth).crearSesion("usuario-1", "Mi gasto", "finanzas");

    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      state: { titulo: "Mi gasto", origen: "finanzas" },
    });
  });
});

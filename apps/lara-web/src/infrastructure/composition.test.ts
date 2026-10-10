// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./adapters/KeycloakAuthAdapter", () => ({ keycloakAuthAdapter: { reales: true } }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function cargar() {
  vi.resetModules();
  return import("./composition");
}

describe("composition root", () => {
  it("con VITE_USE_MOCKS=true usa un adaptador mock por cada puerto", async () => {
    vi.stubEnv("VITE_USE_MOCKS", "true");

    const { adaptadores, usarMocks } = await cargar();

    expect(usarMocks).toBe(true);
    expect(Object.values(adaptadores).map((adaptador) => adaptador.constructor.name)).toEqual([
      "MockAuthAdapter",
      "MockAgenteAdapter",
      "MockModeloAdapter",
      "MockEstadoLabAdapter",
      "MockMenuAdapter",
      "MockFinanzasAdapter",
    ]);
  });

  it.each([undefined, "false", ""])("con VITE_USE_MOCKS=%s usa los adaptadores reales", async (valor) => {
    vi.stubEnv("VITE_USE_MOCKS", valor as string);

    const { adaptadores, usarMocks } = await cargar();

    expect(usarMocks).toBe(false);
    expect(Object.values(adaptadores).map((adaptador) => adaptador.constructor.name)).not.toContain(
      "MockFinanzasAdapter",
    );
    expect(adaptadores.agente.constructor.name).toBe("AdkAgenteAdapter");
    expect(adaptadores.finanzas.constructor.name).toBe("HttpFinanzasAdapter");
  });
});

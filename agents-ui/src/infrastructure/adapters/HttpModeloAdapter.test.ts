import { afterEach, describe, expect, it, vi } from "vitest";
import type { AuthPort } from "../../application/ports/AuthPort";
import { ApiHttpClient } from "./ApiHttpClient";
import { HttpModeloAdapter } from "./HttpModeloAdapter";

const auth: AuthPort = {
  init: async () => null,
  usuarioActual: () => null,
  token: () => null,
  updateToken: async () => "test-token",
  logout: async () => {},
  login: async () => {},
  claimsToken: () => null,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("HttpModeloAdapter", () => {
  it("mapea name a nombre y conserva id y tier", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify([
              { id: "deepseek/deepseek-flash", name: "DeepSeek Flash", tier: "basic" },
              { id: "deepseek/deepseek-v4-pro", name: "DeepSeek V4 Pro", tier: "advanced" },
            ]),
          ),
      ),
    );

    const modelos = await new HttpModeloAdapter(new ApiHttpClient(auth)).listarDisponibles();

    expect(modelos).toEqual([
      { id: "deepseek/deepseek-flash", nombre: "DeepSeek Flash", tier: "basic" },
      { id: "deepseek/deepseek-v4-pro", nombre: "DeepSeek V4 Pro", tier: "advanced" },
    ]);
  });

  it("rechaza cuando el backend devuelve una forma inválida", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify([{ id: "x" }]))));

    await expect(
      new HttpModeloAdapter(new ApiHttpClient(auth)).listarDisponibles(),
    ).rejects.toThrow("inválida");
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import type { AuthPort } from "../../application/ports/AuthPort";
import { ApiHttpClient } from "./ApiHttpClient";

const auth = { updateToken: async () => "token-de-prueba" } as unknown as AuthPort;

function cabecerasDeLaLlamada(fetchMock: ReturnType<typeof vi.fn>): Headers {
  return new Headers((fetchMock.mock.calls[0]?.[1] as RequestInit).headers);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ApiHttpClient", () => {
  it("envía token, Accept y Content-Type JSON cuando hay cuerpo", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true })));
    vi.stubGlobal("fetch", fetchMock);

    await expect(new ApiHttpClient(auth).solicitar("/api/x", { method: "POST", body: "{}" })).resolves.toEqual({
      ok: true,
    });

    const cabeceras = cabecerasDeLaLlamada(fetchMock);
    expect(cabeceras.get("Authorization")).toBe("Bearer token-de-prueba");
    expect(cabeceras.get("Accept")).toBe("application/json");
    expect(cabeceras.get("Content-Type")).toBe("application/json");
  });

  it("respeta el Accept que ya trae la petición (p. ej. SSE)", async () => {
    const fetchMock = vi.fn(async () => new Response(""));
    vi.stubGlobal("fetch", fetchMock);

    await new ApiHttpClient(auth).solicitarRespuesta("/adk/run_sse", {
      headers: { Accept: "text/event-stream" },
    });

    expect(cabecerasDeLaLlamada(fetchMock).get("Accept")).toBe("text/event-stream");
  });

  it("con FormData no fuerza Content-Type: lo fija el navegador con su boundary", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true })));
    vi.stubGlobal("fetch", fetchMock);

    await new ApiHttpClient(auth).solicitarArchivo("/api/finanzas/importar", new File(["a"], "a.csv"));

    const cabeceras = cabecerasDeLaLlamada(fetchMock);
    expect(cabeceras.get("Content-Type")).toBeNull();
    expect(cabeceras.get("Authorization")).toBe("Bearer token-de-prueba");
  });

  it("una respuesta no 2xx lanza con el mensaje por defecto o el indicado", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 503 })));
    const http = new ApiHttpClient(auth);

    await expect(http.solicitar("/api/x")).rejects.toThrow("La API respondió HTTP 503.");
    await expect(http.solicitarRespuesta("/api/x", {}, (status) => `Falló (${status})`)).rejects.toThrow(
      "Falló (503)",
    );
  });
});

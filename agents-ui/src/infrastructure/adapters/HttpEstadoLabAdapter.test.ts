import { afterEach, describe, expect, it, vi } from "vitest";
import { HttpEstadoLabAdapter } from "./HttpEstadoLabAdapter";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("HttpEstadoLabAdapter", () => {
  it.each([200, 401])("HTTP %i cuenta como arriba", async (status) => {
    const fetchMock = vi.fn(async (_url: string) => new Response("", { status }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await new HttpEstadoLabAdapter().comprobar("kc-demo")).toBe("arriba");
    expect(fetchMock.mock.calls[0]?.[0]).toBe("/api/menu");
  });

  it("un 5xx del proxy cuenta como sin respuesta", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 500 })));

    expect(await new HttpEstadoLabAdapter().comprobar("finanzas")).toBe("sin-respuesta");
  });

  it("aborta al vencer el timeout y devuelve sin respuesta", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => reject(new DOMException("abortado", "AbortError")));
          }),
      ),
    );

    expect(await new HttpEstadoLabAdapter(10).comprobar("adk")).toBe("sin-respuesta");
  });
});

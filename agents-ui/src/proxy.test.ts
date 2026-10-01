import { describe, expect, it } from "vitest";
import viteConfig from "../vite.config";

describe("proxy de finanzas", () => {
  it("dirige /api/finanzas a 127.0.0.1:8083 antes del proxy general /api", () => {
    const proxy = viteConfig.server?.proxy as
      | Record<string, { target?: string }>
      | undefined;
    const rutasProxy = Object.keys(proxy ?? {});

    expect(proxy?.["/api/finanzas"]?.target).toBe("http://127.0.0.1:8083");
    expect(rutasProxy.indexOf("/api/finanzas")).toBeGreaterThanOrEqual(0);
    expect(rutasProxy.indexOf("/api/finanzas")).toBeLessThan(rutasProxy.indexOf("/api"));
  });
});

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

  it("expone la salud de Keycloak por el proxy y no por CORS", () => {
    const proxy = viteConfig.server?.proxy as
      | Record<string, { target?: string; rewrite?: (ruta: string) => string }>
      | undefined;

    expect(proxy?.["/salud/keycloak"]?.target).toBe("http://localhost:8080");
    expect(proxy?.["/salud/keycloak"]?.rewrite?.("/salud/keycloak")).toBe("/realms/lab");
  });
});

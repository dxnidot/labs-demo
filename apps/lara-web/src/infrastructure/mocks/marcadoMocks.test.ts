import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("marcado de los mocks", () => {
  it("cada archivo de la carpeta mocks empieza con // MOCK", () => {
    const carpeta = new URL("./", import.meta.url);
    const archivos = readdirSync(carpeta).filter((nombre) => /^Mock.*\.ts$/.test(nombre));
    expect(archivos.length).toBeGreaterThanOrEqual(6);
    for (const nombre of archivos) {
      expect(readFileSync(new URL(nombre, carpeta), "utf8").startsWith("// MOCK"), nombre).toBe(true);
    }
  });

  it("los mocks no usan localStorage ni sessionStorage", () => {
    const carpeta = new URL("./", import.meta.url);
    for (const nombre of readdirSync(carpeta).filter((n) => n.endsWith(".ts") && !n.endsWith(".test.ts"))) {
      expect(readFileSync(new URL(nombre, carpeta), "utf8"), nombre).not.toMatch(/localStorage|sessionStorage/);
    }
  });
});

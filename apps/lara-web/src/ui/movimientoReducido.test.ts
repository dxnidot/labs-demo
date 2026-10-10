// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { comportamientoDeScroll } from "./movimientoReducido";

afterEach(() => {
  vi.unstubAllGlobals();
});

function simular(reducido: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((consulta: string) => ({ matches: reducido && consulta.includes("reduce"), media: consulta })),
  );
}

describe("comportamientoDeScroll", () => {
  it("es suave por defecto", () => {
    simular(false);
    expect(comportamientoDeScroll()).toBe("smooth");
  });

  it("es instantáneo si se pidió movimiento reducido", () => {
    simular(true);
    expect(comportamientoDeScroll()).toBe("auto");
  });

  it("es seguro cuando no existe matchMedia", () => {
    vi.stubGlobal("matchMedia", undefined);
    expect(comportamientoDeScroll()).toBe("smooth");
  });
});

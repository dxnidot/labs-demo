// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { aplicarTema } from "./aplicarApariencia";

function metas() {
  document.head.innerHTML = `
    <meta name="theme-color" content="#eceff2" media="(prefers-color-scheme: light)" data-tema="claro" data-media="(prefers-color-scheme: light)">
    <meta name="theme-color" content="#14171b" media="(prefers-color-scheme: dark)" data-tema="oscuro" data-media="(prefers-color-scheme: dark)">`;
  return Array.from(document.querySelectorAll("meta"));
}

beforeEach(() => {
  delete document.documentElement.dataset.theme;
});

describe("aplicarTema", () => {
  it("forzar claro pone data-theme y deja activa solo la meta clara", () => {
    const [claro, oscuro] = metas();
    aplicarTema("claro");
    expect(document.documentElement.dataset.theme).toBe("claro");
    expect(claro.getAttribute("media")).toBe("(prefers-color-scheme: light)");
    expect(oscuro.getAttribute("media")).toBe("not all");
  });

  it("forzar oscuro deja activa solo la meta oscura", () => {
    const [claro, oscuro] = metas();
    aplicarTema("oscuro");
    expect(document.documentElement.dataset.theme).toBe("oscuro");
    expect(claro.getAttribute("media")).toBe("not all");
    expect(oscuro.getAttribute("media")).toBe("(prefers-color-scheme: dark)");
  });

  it("sistema quita data-theme y restaura las dos consultas de prefers-color-scheme", () => {
    const [claro, oscuro] = metas();
    aplicarTema("oscuro");
    aplicarTema("sistema");
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(claro.getAttribute("media")).toBe("(prefers-color-scheme: light)");
    expect(oscuro.getAttribute("media")).toBe("(prefers-color-scheme: dark)");
  });
});

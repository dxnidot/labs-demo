// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { IndicadorMock } from "./IndicadorMock";

afterEach(() => {
  cleanup();
});

describe("IndicadorMock", () => {
  it("con el modo mock activo muestra MOCK con nombre accesible", () => {
    render(<IndicadorMock activo />);

    expect(screen.getByRole("status", { name: "Modo mock: datos ficticios" }).textContent).toBe("MOCK");
  });

  it("con los servicios reales no muestra nada", () => {
    const { container } = render(<IndicadorMock activo={false} />);

    expect(container.innerHTML).toBe("");
  });
});

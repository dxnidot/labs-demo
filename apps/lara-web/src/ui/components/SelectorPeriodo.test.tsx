// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SelectorPeriodo } from "./SelectorPeriodo";

afterEach(cleanup);

describe("SelectorPeriodo", () => {
  it("muestra el mes en texto dentro de un grupo Periodo", () => {
    render(<SelectorPeriodo onCambiar={vi.fn()} periodo="2026-09" />);

    const grupo = screen.getByRole("group", { name: "Periodo" });
    expect(within(grupo).getByText("Septiembre 2026")).toBeTruthy();
  });

  it("Mes anterior y Mes siguiente piden el periodo contiguo, también entre años", () => {
    const onCambiar = vi.fn();
    const { rerender } = render(<SelectorPeriodo onCambiar={onCambiar} periodo="2026-01" />);

    fireEvent.click(screen.getByRole("button", { name: "Mes anterior" }));
    expect(onCambiar).toHaveBeenLastCalledWith("2025-12");

    rerender(<SelectorPeriodo onCambiar={onCambiar} periodo="2026-12" />);
    fireEvent.click(screen.getByRole("button", { name: "Mes siguiente" }));
    expect(onCambiar).toHaveBeenLastCalledWith("2027-01");
  });

  it("las flechas tienen 44px de área táctil en angosto y el mes se anuncia al cambiar", () => {
    render(<SelectorPeriodo onCambiar={vi.fn()} periodo="2026-09" />);

    expect(screen.getByRole("button", { name: "Mes anterior" }).className).toContain("size-11");
    expect(screen.getByText("Septiembre 2026").getAttribute("aria-live")).toBe("polite");
  });
});

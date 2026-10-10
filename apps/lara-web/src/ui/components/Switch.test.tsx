// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Switch } from "./Switch";

afterEach(() => {
  cleanup();
});

describe("Switch", () => {
  it("expone role=switch, nombre y estado, y alterna al pulsarlo", () => {
    const onCambiar = vi.fn();
    render(<Switch activo={false} etiqueta="Tarjeta A activa" onCambiar={onCambiar} />);

    const control = screen.getByRole("switch", { name: "Tarjeta A activa" });
    expect(control.getAttribute("aria-checked")).toBe("false");
    fireEvent.click(control);
    expect(onCambiar).toHaveBeenCalledTimes(1);
  });

  it("refleja el estado activo", () => {
    render(<Switch activo etiqueta="Tarjeta A activa" onCambiar={vi.fn()} />);

    expect(screen.getByRole("switch").getAttribute("aria-checked")).toBe("true");
  });

  it("no responde si está deshabilitado", () => {
    const onCambiar = vi.fn();
    render(<Switch activo deshabilitado etiqueta="Tarjeta A activa" onCambiar={onCambiar} />);

    fireEvent.click(screen.getByRole("switch"));
    expect(onCambiar).not.toHaveBeenCalled();
  });

  it("tiene área táctil de 44px y pista apagada con el token de contraste", () => {
    const { container, rerender } = render(<Switch activo={false} etiqueta="x" onCambiar={vi.fn()} />);

    expect(screen.getByRole("switch").className).toContain("size-11");
    expect(container.innerHTML).toContain("bg-control-off");
    rerender(<Switch activo etiqueta="x" onCambiar={vi.fn()} />);
    expect(container.innerHTML).toContain("bg-accent");
    expect(container.innerHTML).not.toContain("bg-control-off");
  });
});

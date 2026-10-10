// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DialogoApariencia } from "./DialogoApariencia";

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.font;
  delete document.documentElement.dataset.theme;
});

afterEach(() => {
  cleanup();
});

describe("DialogoApariencia", () => {
  it("muestra la fuente por defecto seleccionada y es un diálogo modal con nombre", () => {
    render(<DialogoApariencia onCerrar={vi.fn()} />);

    const dialogo = screen.getByRole("dialog", { name: "Apariencia" });
    expect(dialogo.getAttribute("aria-modal")).toBe("true");
    expect((screen.getByRole("radio", { name: "IBM Plex Sans" }) as HTMLInputElement).checked).toBe(
      true,
    );
  });

  it("al elegir otra fuente la aplica a <html> y la guarda en lara.fuente", () => {
    render(<DialogoApariencia onCerrar={vi.fn()} />);

    fireEvent.click(screen.getByRole("radio", { name: "IBM Plex Mono" }));

    expect(document.documentElement.dataset.font).toBe("ibm-plex-mono");
    expect(localStorage.getItem("lara.fuente")).toBe("ibm-plex-mono");
  });

  it("parte de la fuente guardada", () => {
    localStorage.setItem("lara.fuente", "ibm-plex-mono");
    render(<DialogoApariencia onCerrar={vi.fn()} />);

    expect((screen.getByRole("radio", { name: "IBM Plex Mono" }) as HTMLInputElement).checked).toBe(
      true,
    );
  });

  it("se cierra con Escape, con el botón y al pulsar el fondo", () => {
    const onCerrar = vi.fn();
    render(<DialogoApariencia onCerrar={onCerrar} />);

    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "Cerrar apariencia" }));
    fireEvent.click(screen.getByTestId("fondo-apariencia"));

    expect(onCerrar).toHaveBeenCalledTimes(3);
  });

  it("no cierra al pulsar dentro del panel", () => {
    const onCerrar = vi.fn();
    render(<DialogoApariencia onCerrar={onCerrar} />);

    fireEvent.click(screen.getByRole("dialog", { name: "Apariencia" }));

    expect(onCerrar).not.toHaveBeenCalled();
  });

  it("el tema por defecto es Sistema y al elegir Claro lo aplica a <html> y lo guarda en lara.tema", () => {
    render(<DialogoApariencia onCerrar={vi.fn()} />);

    expect((screen.getByRole("radio", { name: "Sistema" }) as HTMLInputElement).checked).toBe(true);

    fireEvent.click(screen.getByRole("radio", { name: "Claro" }));

    expect(document.documentElement.dataset.theme).toBe("claro");
    expect(localStorage.getItem("lara.tema")).toBe("claro");
  });

  it("al volver a Sistema quita el atributo data-theme", () => {
    render(<DialogoApariencia onCerrar={vi.fn()} />);

    fireEvent.click(screen.getByRole("radio", { name: "Oscuro" }));
    fireEvent.click(screen.getByRole("radio", { name: "Sistema" }));

    expect(document.documentElement.dataset.theme).toBeUndefined();
  });
});

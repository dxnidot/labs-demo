// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AvisoCarga, Esqueleto, EsqueletoLineas, EsqueletoTabla } from "./Esqueleto";
import { EstadoError } from "./EstadoError";
import { EstadoVacio } from "./EstadoVacio";

afterEach(() => {
  cleanup();
});

describe("Esqueleto y AvisoCarga", () => {
  it("el aviso se anuncia como status y los bloques visuales se ocultan a lectores de pantalla", () => {
    const { container } = render(
      <>
        <AvisoCarga texto="Cargando sesiones…" />
        <Esqueleto />
        <EsqueletoLineas cantidad={4} />
        <EsqueletoTabla filas={3} />
      </>,
    );

    expect(screen.getByRole("status").textContent).toBe("Cargando sesiones…");
    expect(screen.getByRole("status").className).toContain("sr-only");
    const bloques = container.querySelectorAll(".animate-pulse");
    expect(bloques.length).toBe(1 + 4 + 1 + 3);
    for (const bloque of bloques) {
      expect(bloque.closest('[aria-hidden="true"]')).not.toBeNull();
    }
  });
});

describe("EstadoError", () => {
  it("anuncia el mensaje como alerta y ofrece Reintentar", () => {
    const onReintentar = vi.fn();
    render(<EstadoError mensaje="No se pudo cargar." onReintentar={onReintentar} />);

    expect(screen.getByRole("alert").textContent).toBe("No se pudo cargar.");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onReintentar).toHaveBeenCalledTimes(1);
  });

  it("sin acción de reintento no muestra el botón", () => {
    render(<EstadoError mensaje="Error sin reintento." />);

    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("EstadoVacio", () => {
  it("muestra solo el mensaje que se le da", () => {
    render(<EstadoVacio mensaje="Todavía no hay sesiones guardadas." />);

    expect(screen.getByText("Todavía no hay sesiones guardadas.")).toBeTruthy();
  });
});

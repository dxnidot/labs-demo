// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AvisoProveedorModelo, textoAvisoProveedor } from "./AvisoProveedorModelo";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe("AvisoProveedorModelo", () => {
  it("muestra el texto fijo de ADR-0007, exactamente como se acordó", () => {
    render(<AvisoProveedorModelo id="aviso" />);

    expect(textoAvisoProveedor).toBe(
      "Lo que escribas aquí se envía al proveedor del modelo para generar la respuesta. No incluyas datos reales que no quieras compartir con él.",
    );
    expect(screen.getByText(textoAvisoProveedor).id).toBe("aviso");
  });

  it("es una línea fija: no tiene botón de cerrar ni ningún control", () => {
    render(<AvisoProveedorModelo id="aviso" />);

    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("no guarda nada en el navegador", () => {
    render(<AvisoProveedorModelo id="aviso" />);

    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
});

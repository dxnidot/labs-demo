// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { MemoriaPort } from "../application/ports/MemoriaPort";
import type { ColeccionMemoria, ResultadoMemoria } from "../domain/ResultadoMemoria";
import { MemoriaPage } from "./MemoriaPage";

const colecciones: ColeccionMemoria[] = [
  { clave: "guia", nombre: "Guías de ejemplo" },
  { clave: "notas", nombre: "Notas de sesión" },
];
const resultados: ResultadoMemoria[] = [
  { fuente: "guia/flujo.md · fragmento 1", fragmento: "Ejemplo ficticio de un flujo de autorización.", puntaje: 0.86 },
  { fuente: "nota · ejemplo", fragmento: "Nota ficticia sobre una práctica.", puntaje: 0.64 },
];

function puertoFalso(overrides: Partial<MemoriaPort> = {}): MemoriaPort {
  return {
    listarColecciones: vi.fn(async () => colecciones),
    buscar: vi.fn(async () => resultados),
    ...overrides,
  };
}

afterEach(cleanup);

describe("MemoriaPage", () => {
  it("anuncia la carga y presenta esqueletos mientras espera el puerto", async () => {
    const buscar = vi.fn(() => new Promise<ResultadoMemoria[]>(() => {}));
    render(<MemoriaPage memoria={puertoFalso({ buscar })} />);

    expect(screen.getByRole("status").textContent).toBe("Buscando en la memoria…");
    expect(screen.getByRole("region", { name: "Resultados de búsqueda" })).toBeTruthy();
    expect(document.querySelectorAll(".animate-pulse")).toHaveLength(6);
  });

  it("muestra fuente, fragmento, puntaje y barra de similitud", async () => {
    render(<MemoriaPage memoria={puertoFalso()} />);

    expect(await screen.findByText(resultados[0].fuente)).toBeTruthy();
    expect(screen.getByText(resultados[0].fragmento)).toBeTruthy();
    expect(screen.getByText("0.86")).toBeTruthy();
    expect(screen.getByRole("img", { name: "Similitud 86%" })).toBeTruthy();
  });

  it("vuelve a buscar al elegir una colección", async () => {
    const buscar = vi.fn(async (_consulta: string, _coleccion?: string) => resultados.slice(0, 1));
    render(<MemoriaPage memoria={puertoFalso({ buscar })} />);

    fireEvent.click(await screen.findByRole("button", { name: "Guías de ejemplo" }));

    await waitFor(() => expect(buscar).toHaveBeenLastCalledWith("configurar PKCE en un cliente público", "guia"));
    expect(screen.queryByText(resultados[1].fuente)).toBeNull();
  });

  it("presenta el estado vacío cuando no hay coincidencias", async () => {
    const buscar = vi.fn(async (consulta: string) => (consulta === "sin coincidencias" ? [] : resultados));
    const memoria = puertoFalso({ buscar });
    render(<MemoriaPage memoria={memoria} />);
    await screen.findByText(resultados[0].fuente);

    fireEvent.change(screen.getByRole("searchbox", { name: "Buscar en memoria" }), {
      target: { value: "sin coincidencias" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));

    expect(await screen.findByText("No encontramos fragmentos relacionados. Prueba con otras palabras o colecciones.")).toBeTruthy();
  });

  it("permite reintentar una búsqueda que falló", async () => {
    const buscar = vi.fn<MemoriaPort["buscar"]>()
      .mockRejectedValueOnce(new Error("Fallo ficticio"))
      .mockResolvedValueOnce(resultados);
    render(<MemoriaPage memoria={puertoFalso({ buscar })} />);

    fireEvent.click(await screen.findByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText(resultados[0].fuente)).toBeTruthy();
    expect(buscar).toHaveBeenCalledTimes(2);
  });
});

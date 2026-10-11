// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { GastosFijosPort } from "../application/ports/GastosFijosPort";
import type { GastoFijoDetectado, ProyeccionMensual } from "../domain/GastoFijo";
import { MockGastosFijosAdapter } from "../infrastructure/mocks/MockGastosFijosAdapter";
import { GastosFijosPage } from "./GastosFijosPage";

const detectado: GastoFijoDetectado = {
  id: "streaming-test",
  concepto: "Streaming de prueba",
  dia: 18,
  monto: 219,
  origen: "Wallet",
  confirmado: false,
};
const proyeccion: ProyeccionMensual[] = [
  { mes: "oct", total: 219, esPico: false },
  { mes: "nov", total: 219, esPico: false },
  { mes: "dic", total: 1019, esPico: true, explicacion: "Diciembre incluye un pago anual ficticio." },
  { mes: "ene", total: 219, esPico: false },
  { mes: "feb", total: 219, esPico: false },
  { mes: "mar", total: 219, esPico: false },
];

function puertoFalso(cambios: Partial<GastosFijosPort> = {}): GastosFijosPort {
  return {
    listarDetectados: vi.fn(async () => [detectado]),
    confirmar: vi.fn(async (id: string) => ({ ...detectado, id, confirmado: true })),
    descartar: vi.fn(async () => undefined),
    proyeccionSeisMeses: vi.fn(async () => proyeccion),
    ...cambios,
  };
}

afterEach(cleanup);

describe("GastosFijosPage", () => {
  it("muestra aviso y esqueleto mientras espera", () => {
    const puerto = puertoFalso({ listarDetectados: vi.fn(() => new Promise<GastoFijoDetectado[]>(() => {})) });
    render(<GastosFijosPage gastosFijos={puerto} />);
    expect(screen.getByRole("status").textContent).toContain("Cargando gastos fijos");
    expect(screen.getByLabelText("Cargando gastos fijos")).toBeTruthy();
  });

  it("muestra la tabla y la proyección del mock ficticio", async () => {
    render(<GastosFijosPage gastosFijos={new MockGastosFijosAdapter()} />);
    expect(await screen.findByRole("table")).toBeTruthy();
    expect(screen.getByText("Renta")).toBeTruthy();
    expect(screen.getByText("$7,500.00")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Confirmar" })).toHaveLength(2);
    expect(screen.getByText("Proyección 6 meses")).toBeTruthy();
    expect(screen.getByText(/Diciembre sube por el seguro anual/)).toBeTruthy();
    expect(screen.getByLabelText(/dic: \$19,067.00, mes con mayor gasto/)).toBeTruthy();
  });

  it("confirma por el puerto y actualiza el estado de esa fila", async () => {
    const confirmar = vi.fn(async (id: string) => ({ ...detectado, id, confirmado: true }));
    render(<GastosFijosPage gastosFijos={puertoFalso({ confirmar })} />);
    fireEvent.click(await screen.findByRole("button", { name: "Confirmar" }));
    await waitFor(() => expect(screen.getByText("confirmado")).toBeTruthy());
    expect(confirmar).toHaveBeenCalledWith(detectado.id);
  });

  it("descarta por el puerto y quita la fila", async () => {
    const descartar = vi.fn(async () => undefined);
    render(<GastosFijosPage gastosFijos={puertoFalso({ descartar })} />);
    fireEvent.click(await screen.findByRole("button", { name: "Descartar" }));
    await waitFor(() => expect(screen.queryByText("Streaming de prueba")).toBeNull());
    expect(descartar).toHaveBeenCalledWith(detectado.id);
  });

  it("muestra un estado vacío para una lista sin gastos", async () => {
    render(<GastosFijosPage gastosFijos={puertoFalso({ listarDetectados: vi.fn(async () => []) })} />);
    expect(await screen.findByText("Aún no hay gastos fijos detectados. Cuando Lara encuentre pagos recurrentes, aparecerán aquí.")).toBeTruthy();
  });

  it("permite reintentar cuando falla la carga", async () => {
    const listarDetectados = vi.fn<() => Promise<GastoFijoDetectado[]>>()
      .mockRejectedValueOnce(new Error("No se pudo consultar la lista."))
      .mockResolvedValueOnce([detectado]);
    render(<GastosFijosPage gastosFijos={puertoFalso({ listarDetectados })} />);
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", "No se pudo consultar la lista.");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Streaming de prueba")).toBeTruthy();
    expect(listarDetectados).toHaveBeenCalledTimes(2);
  });
});

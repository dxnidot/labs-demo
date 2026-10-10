// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { FinanzasPort } from "../application/ports/FinanzasPort";
import type { EventoCalendario } from "../domain/EventoCalendario";
import type { Tarjeta } from "../domain/Tarjeta";
import { FinanzasTarjetasTab } from "./FinanzasTarjetasTab";

const hoy = "2030-10-01";
const tarjetaActiva: Tarjeta = {
  id: "tarjeta-prueba",
  alias: "Tarjeta de prueba",
  ultimos4: "0042",
  diaCorte: 12,
  diaPago: 25,
  permiteLiquidarMsiAnticipado: true,
  activa: true,
};
const tarjetaSinPagoCercano: Tarjeta = {
  id: "tarjeta-lejana",
  alias: "Otra tarjeta",
  ultimos4: "5511",
  diaCorte: 3,
  diaPago: 6,
  permiteLiquidarMsiAnticipado: false,
  activa: true,
};
const tarjetaInactiva: Tarjeta = {
  id: "tarjeta-secundaria",
  alias: "Segunda tarjeta",
  ultimos4: "9876",
  diaCorte: 8,
  diaPago: 20,
  permiteLiquidarMsiAnticipado: false,
  activa: false,
};
const eventos: EventoCalendario[] = [
  { fecha: "2030-10-03", tipo: "CORTE", alias: "Tarjeta de prueba" },
  { fecha: "2030-10-06", tipo: "PAGO", alias: "Otra tarjeta" },
  { fecha: "2030-10-25", tipo: "PAGO", alias: "Tarjeta de prueba" },
];

function puertoFalso(actualizar = vi.fn(async (tarjeta: Tarjeta) => tarjeta)): FinanzasPort {
  return {
    listarTarjetas: vi.fn(),
    listarMovimientos: vi.fn(),
    consultarResumenMensual: vi.fn(),
    consultarCalendario: vi.fn(async () => eventos),
    actualizarTarjeta: actualizar,
    previsualizarImportacion: vi.fn(),
    confirmarImportacion: vi.fn(),
  };
}

function montar(
  props: Partial<{
    eventos: EventoCalendario[];
    finanzas: FinanzasPort;
    onTarjetaActualizada: (tarjeta: Tarjeta) => void;
    tarjetas: Tarjeta[];
  }> = {},
) {
  return render(
    <FinanzasTarjetasTab
      eventos={props.eventos ?? eventos}
      finanzas={props.finanzas ?? puertoFalso()}
      hoy={hoy}
      onTarjetaActualizada={props.onTarjetaActualizada ?? vi.fn()}
      tarjetas={props.tarjetas ?? [tarjetaActiva, tarjetaSinPagoCercano, tarjetaInactiva]}
    />,
  );
}

afterEach(cleanup);

describe("FinanzasTarjetasTab · próximo pago", () => {
  it("destaca el pago más cercano con alias, •••• , fecha y en cuántos días", () => {
    montar();

    const bloque = screen.getByRole("region", { name: "Próximo pago" });
    expect(within(bloque).getByText("Otra tarjeta")).toBeTruthy();
    expect(within(bloque).getByText("••••5511")).toBeTruthy();
    expect(within(bloque).getByText(/6 oct · en 5 días/)).toBeTruthy();
    expect(within(bloque).getByRole("button", { name: "Ver calendario" })).toBeTruthy();
  });

  it("sin pagos próximos lo dice en lugar de inventar uno", () => {
    montar({ eventos: [] });

    const bloque = screen.getByRole("region", { name: "Próximo pago" });
    expect(within(bloque).getByText("Sin pagos próximos")).toBeTruthy();
    expect(within(bloque).getByText("No hay pagos en los próximos 30 días.")).toBeTruthy();
  });

  it("Ver calendario lleva el foco al calendario mientras carga", () => {
    const desplazar = vi.fn();
    Element.prototype.scrollIntoView = desplazar;
    montar({ finanzas: { ...puertoFalso(), consultarCalendario: vi.fn(() => new Promise<EventoCalendario[]>(() => {})) } });

    fireEvent.click(screen.getByRole("button", { name: "Ver calendario" }));

    expect(document.activeElement?.id).toBe("calendario-pagos");
    expect(desplazar).toHaveBeenCalled();
  });

  it("con el calendario cargado, Ver calendario enfoca el día seleccionado para usar las flechas", async () => {
    Element.prototype.scrollIntoView = vi.fn();
    montar();
    const grid = await screen.findByRole("grid", { name: "Octubre 2030" });

    fireEvent.click(screen.getByRole("button", { name: "Ver calendario" }));

    const seleccionado = within(grid).getByRole("gridcell", { selected: true });
    expect(seleccionado.getAttribute("aria-label")).toBe("6 de octubre, 1 pago");
    expect(document.activeElement).toBe(seleccionado);
  });
});

describe("FinanzasTarjetasTab · Mis tarjetas", () => {
  it("cuenta activas e inactivas y muestra cada tarjeta como tile con corte, pago y MSI", () => {
    montar();

    expect(screen.getByText("2 activas · 1 inactiva")).toBeTruthy();
    const tile = screen.getByRole("heading", { name: "Tarjeta de prueba", level: 3 }).closest("li") as HTMLElement;
    expect(within(tile).getByText("••••0042")).toBeTruthy();
    expect(within(tile).getByText("día 12")).toBeTruthy();
    expect(within(tile).getByText("día 25")).toBeTruthy();
    expect(within(tile).getByText("Pago en 24 días")).toBeTruthy();
    expect(within(tile).getByText("MSI: sí")).toBeTruthy();
    expect(within(tile).getAllByRole("switch")).toHaveLength(1);
  });

  it("la tarjeta inactiva queda atenuada con 'Inactiva' y 'fuera del calendario', sin cuenta atrás", () => {
    montar();

    const tile = screen.getByRole("heading", { name: "Segunda tarjeta", level: 3 }).closest("li") as HTMLElement;
    expect(within(tile).getByText("Inactiva")).toBeTruthy();
    expect(within(tile).getByText("fuera del calendario")).toBeTruthy();
    expect(within(tile).queryByText(/^Pago en/)).toBeNull();
    expect(within(tile).getByRole("switch", { name: "Segunda tarjeta activa" }).getAttribute("aria-checked")).toBe(
      "false",
    );
  });

  it("solo la tarjeta del próximo pago lleva el estilo destacado", () => {
    montar();

    const proxima = screen.getByText("Pago en 5 días");
    const otra = screen.getByText("Pago en 24 días");
    expect(proxima.className).toContain("bg-highlight");
    expect(otra.className).not.toContain("bg-highlight");
  });

  it("alterna la tarjeta con el puerto y notifica el estado devuelto", async () => {
    const actualizar = vi.fn(async (tarjeta: Tarjeta) => tarjeta);
    const alActualizar = vi.fn();
    montar({ finanzas: puertoFalso(actualizar), onTarjetaActualizada: alActualizar, tarjetas: [tarjetaActiva] });

    fireEvent.click(screen.getByRole("switch", { name: "Tarjeta de prueba activa" }));

    await waitFor(() => expect(alActualizar).toHaveBeenCalled());
    expect(actualizar).toHaveBeenCalledWith({ ...tarjetaActiva, activa: false });
    expect(alActualizar).toHaveBeenCalledWith({ ...tarjetaActiva, activa: false });
  });

  it("muestra el error cuando falla la actualización", async () => {
    const actualizar = vi.fn(async () => {
      throw new Error("La API respondió HTTP 503.");
    });
    montar({ finanzas: puertoFalso(actualizar), tarjetas: [tarjetaActiva] });

    fireEvent.click(screen.getByRole("switch", { name: "Tarjeta de prueba activa" }));

    expect((await screen.findByRole("alert")).textContent).toBe("La API respondió HTTP 503.");
  });

  it("sin tarjetas muestra el estado vacío con una indicación clara", () => {
    montar({ tarjetas: [], eventos: [] });

    expect(screen.getByText("Aún no tienes tarjetas. Cárgalas desde el asistente de Finanzas.")).toBeTruthy();
    expect(screen.getByText("0 activas · 0 inactivas")).toBeTruthy();
  });
});

describe("FinanzasTarjetasTab · calendario", () => {
  it("incluye el calendario en cuadrícula del mes del próximo pago", async () => {
    montar();

    expect(await screen.findByRole("grid", { name: "Octubre 2030" })).toBeTruthy();
  });
});

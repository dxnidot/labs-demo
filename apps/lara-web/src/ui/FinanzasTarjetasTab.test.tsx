// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { FinanzasPort } from "../application/ports/FinanzasPort";
import type { EventoCalendario } from "../domain/EventoCalendario";
import type { Tarjeta } from "../domain/Tarjeta";
import { FinanzasTarjetasTab } from "./FinanzasTarjetasTab";

const tarjetaActiva: Tarjeta = {
  id: "tarjeta-prueba",
  alias: "Tarjeta de prueba",
  ultimos4: "0042",
  diaCorte: 12,
  diaPago: 25,
  permiteLiquidarMsiAnticipado: true,
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
  { fecha: "2030-10-03", tipo: "PAGO", alias: "Otra tarjeta" },
  { fecha: "2030-10-06", tipo: "PAGO", alias: "Tercera tarjeta" },
];

function puertoFalso(actualizar = vi.fn(async (tarjeta: Tarjeta) => tarjeta)): FinanzasPort {
  return {
    listarTarjetas: vi.fn(),
    listarMovimientos: vi.fn(),
    consultarResumenMensual: vi.fn(),
    consultarCalendario: vi.fn(),
    actualizarTarjeta: actualizar,
    previsualizarImportacion: vi.fn(),
    confirmarImportacion: vi.fn(),
  };
}

afterEach(cleanup);

describe("FinanzasTarjetasTab", () => {
  it("muestra la tabla con un único control switch por tarjeta y el calendario agrupado por fecha", () => {
    render(
      <FinanzasTarjetasTab
        eventos={eventos}
        finanzas={puertoFalso()}
        onTarjetaActualizada={vi.fn()}
        tarjetas={[tarjetaActiva, tarjetaInactiva]}
      />,
    );

    const tabla = screen.getByRole("table", { name: "Tarjetas registradas" });
    const fila = within(tabla).getByRole("row", { name: /Tarjeta de prueba/ });
    expect(within(fila).getByText("••••0042")).toBeTruthy();
    expect(within(fila).getByText("día 12")).toBeTruthy();
    expect(within(fila).getByText("día 25")).toBeTruthy();
    expect(within(fila).getByText("Sí")).toBeTruthy();
    expect(within(fila).getAllByRole("switch")).toHaveLength(1);
    expect(within(fila).queryAllByRole("button")).toHaveLength(0);
    expect(
      screen.getByRole("switch", { name: "Tarjeta de prueba activa" }).getAttribute("aria-checked"),
    ).toBe("true");
    expect(
      screen.getByRole("switch", { name: "Segunda tarjeta activa" }).getAttribute("aria-checked"),
    ).toBe("false");

    const grupos = screen.getAllByRole("heading", { level: 3 });
    expect(grupos).toHaveLength(2);
    const grupoDelTres = grupos[0]?.closest("li") as HTMLElement;
    expect(within(grupoDelTres).getByText("corte")).toBeTruthy();
    expect(within(grupoDelTres).getByText("pago")).toBeTruthy();
    expect(screen.getByText(/regla pendiente/)).toBeTruthy();
  });

  it("alterna la tarjeta con el puerto y notifica el estado devuelto", async () => {
    const actualizar = vi.fn(async (tarjeta: Tarjeta) => tarjeta);
    const alActualizar = vi.fn();
    render(
      <FinanzasTarjetasTab
        eventos={[]}
        finanzas={puertoFalso(actualizar)}
        onTarjetaActualizada={alActualizar}
        tarjetas={[tarjetaActiva]}
      />,
    );

    fireEvent.click(screen.getByRole("switch", { name: "Tarjeta de prueba activa" }));

    await waitFor(() => expect(alActualizar).toHaveBeenCalled());
    expect(actualizar).toHaveBeenCalledWith({ ...tarjetaActiva, activa: false });
    expect(alActualizar).toHaveBeenCalledWith({ ...tarjetaActiva, activa: false });
  });

  it("muestra el error cuando falla la actualización", async () => {
    const actualizar = vi.fn(async () => {
      throw new Error("La API respondió HTTP 503.");
    });
    render(
      <FinanzasTarjetasTab
        eventos={[]}
        finanzas={puertoFalso(actualizar)}
        onTarjetaActualizada={vi.fn()}
        tarjetas={[tarjetaActiva]}
      />,
    );

    fireEvent.click(screen.getByRole("switch", { name: "Tarjeta de prueba activa" }));

    expect((await screen.findByRole("alert")).textContent).toBe("La API respondió HTTP 503.");
  });

  it("muestra los estados vacíos sin tarjetas ni eventos", () => {
    render(
      <FinanzasTarjetasTab
        eventos={[]}
        finanzas={puertoFalso()}
        onTarjetaActualizada={vi.fn()}
        tarjetas={[]}
      />,
    );

    expect(
      screen.getByText("Aún no tienes tarjetas. Cárgalas desde el chat de Finanzas."),
    ).toBeTruthy();
    expect(
      screen.getByText("No hay cortes ni pagos programados en los próximos 30 días."),
    ).toBeTruthy();
  });
});

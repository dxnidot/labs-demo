// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { FinanzasPort } from "../application/ports/FinanzasPort";
import type { EventoCalendario } from "../domain/EventoCalendario";
import type { Tarjeta } from "../domain/Tarjeta";
import { CalendarioPagos } from "./CalendarioPagos";

const hoy = "2026-09-30";
const tarjetas: Tarjeta[] = [
  { id: "a", alias: "Tarjeta A", ultimos4: "1234", diaCorte: 15, diaPago: 5, permiteLiquidarMsiAnticipado: false, activa: true },
  { id: "b", alias: "Tarjeta B", ultimos4: "5678", diaCorte: 25, diaPago: 6, permiteLiquidarMsiAnticipado: true, activa: true },
];
const octubre: EventoCalendario[] = [
  { fecha: "2026-10-01", tipo: "CORTE", alias: "Tarjeta A" },
  { fecha: "2026-10-05", tipo: "PAGO", alias: "Tarjeta A" },
  { fecha: "2026-10-06", tipo: "PAGO", alias: "Tarjeta B" },
  { fecha: "2026-10-15", tipo: "PAGO", alias: "Tarjeta A" },
  { fecha: "2026-10-15", tipo: "CORTE", alias: "Tarjeta B" },
  // La API puede devolver el borde del mes siguiente: no debe pintarse en octubre.
  { fecha: "2026-11-01", tipo: "CORTE", alias: "Tarjeta A" },
];

function puerto(consulta = vi.fn(async (_desde: string, _dias: number) => octubre)): FinanzasPort {
  return {
    listarTarjetas: vi.fn(),
    listarMovimientos: vi.fn(),
    consultarResumenMensual: vi.fn(),
    consultarCalendario: consulta,
    actualizarTarjeta: vi.fn(),
    previsualizarImportacion: vi.fn(),
    confirmarImportacion: vi.fn(),
  };
}

function montar(finanzas = puerto(), fechaInicial = "2026-10-05") {
  return render(<CalendarioPagos fechaInicial={fechaInicial} finanzas={finanzas} hoy={hoy} tarjetas={tarjetas} />);
}

afterEach(cleanup);

describe("CalendarioPagos · estructura", () => {
  it("es un grid con 7 encabezados de columna (lunes primero) y los 31 días de octubre", async () => {
    montar();

    const grid = await screen.findByRole("grid", { name: "Octubre 2026" });
    expect(within(grid).getAllByRole("columnheader").map((c) => c.getAttribute("aria-label"))).toEqual([
      "lunes",
      "martes",
      "miércoles",
      "jueves",
      "viernes",
      "sábado",
      "domingo",
    ]);
    const dias = within(grid).getAllByRole("gridcell").filter((celda) => celda.getAttribute("aria-hidden") !== "true");
    expect(dias).toHaveLength(31);
    // 1 de octubre de 2026 es jueves: tres huecos antes del primer día.
    const huecos = within(grid).getAllByRole("gridcell", { hidden: true }).filter((c) => c.getAttribute("aria-hidden") === "true");
    expect(huecos.length).toBeGreaterThanOrEqual(3);
    expect(within(grid).getAllByRole("row")[1].children[3].getAttribute("aria-label")).toBe("1 de octubre, 1 corte");
  });

  it("describe cada día con sus pagos y cortes, sin pintar el borde del mes siguiente", async () => {
    montar();
    const grid = await screen.findByRole("grid", { name: "Octubre 2026" });

    expect(within(grid).getByRole("gridcell", { name: "5 de octubre, 1 pago" })).toBeTruthy();
    expect(within(grid).getByRole("gridcell", { name: "15 de octubre, 1 pago y 1 corte" })).toBeTruthy();
    expect(within(grid).getByRole("gridcell", { name: "2 de octubre" })).toBeTruthy();
    expect(within(grid).getAllByRole("gridcell", { name: /1 corte/ })).toHaveLength(2);
  });

  it("consulta el mes completo al puerto y muestra la leyenda ● pago ○ corte", async () => {
    const consulta = vi.fn(async (_desde: string, _dias: number) => octubre);
    montar(puerto(consulta));

    await screen.findByRole("grid", { name: "Octubre 2026" });
    expect(consulta).toHaveBeenCalledWith("2026-10-01", 31);
    const leyenda = screen.getByRole("list", { name: "Leyenda" });
    expect(within(leyenda).getByText("pago")).toBeTruthy();
    expect(within(leyenda).getByText("corte")).toBeTruthy();
  });
});

describe("CalendarioPagos · selección y detalle", () => {
  it("abre con el día inicial seleccionado y detalla sus eventos con la tarjeta enmascarada", async () => {
    montar();

    const dia = await screen.findByRole("gridcell", { name: "5 de octubre, 1 pago" });
    expect(dia.getAttribute("aria-selected")).toBe("true");
    expect(dia.getAttribute("tabindex")).toBe("0");
    expect(screen.getByText("lunes 5 oct")).toBeTruthy();
    expect(screen.getByText("Tarjeta A")).toBeTruthy();
    expect(screen.getByText("••••1234")).toBeTruthy();
    expect(screen.getByText("en 5 días")).toBeTruthy();
  });

  it("el clic selecciona otro día y un día sin eventos lo dice", async () => {
    montar();

    fireEvent.click(await screen.findByRole("gridcell", { name: "2 de octubre" }));

    expect(screen.getByText("Sin pagos ni cortes este día.")).toBeTruthy();
    expect(screen.getByRole("gridcell", { name: "2 de octubre" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("gridcell", { name: "5 de octubre, 1 pago" }).getAttribute("aria-selected")).toBe("false");
  });

  it("un día con varios eventos los lista todos", async () => {
    montar();

    fireEvent.click(await screen.findByRole("gridcell", { name: "15 de octubre, 1 pago y 1 corte" }));

    const eventos = within(screen.getByRole("list", { name: "Eventos del día" })).getAllByRole("listitem");
    expect(eventos).toHaveLength(2);
    expect(eventos[0].textContent).toContain("pago");
    expect(eventos[0].textContent).toContain("Tarjeta A");
    expect(eventos[1].textContent).toContain("corte");
    expect(eventos[1].textContent).toContain("Tarjeta B");
    expect(eventos[1].textContent).toContain("••••5678");
  });
});

describe("CalendarioPagos · teclado", () => {
  async function celdaActiva() {
    const grid = await screen.findByRole("grid", { name: "Octubre 2026" });
    const celda = within(grid).getByRole("gridcell", { selected: true });
    celda.focus();
    return { grid, celda };
  }

  it("solo el día seleccionado entra en el orden de tabulación", async () => {
    montar();
    const { grid } = await celdaActiva();

    const conTabindex = within(grid)
      .getAllByRole("gridcell")
      .filter((celda) => celda.getAttribute("tabindex") === "0");
    expect(conTabindex).toHaveLength(1);
  });

  it("las flechas mueven la selección y el foco por días y semanas", async () => {
    montar();
    const { grid, celda } = await celdaActiva();

    fireEvent.keyDown(celda, { key: "ArrowRight" });
    expect(within(grid).getByRole("gridcell", { name: "6 de octubre, 1 pago" }).getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(within(grid).getByRole("gridcell", { name: "6 de octubre, 1 pago" }));

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "ArrowDown" });
    expect(within(grid).getByRole("gridcell", { name: "13 de octubre" }).getAttribute("aria-selected")).toBe("true");

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "ArrowUp" });
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "ArrowLeft" });
    expect(within(grid).getByRole("gridcell", { name: "5 de octubre, 1 pago" }).getAttribute("aria-selected")).toBe("true");
  });

  it("Inicio y Fin saltan al lunes y al domingo de la semana", async () => {
    montar();
    const { grid, celda } = await celdaActiva();

    fireEvent.keyDown(celda, { key: "Home" });
    expect(within(grid).getByRole("gridcell", { name: "5 de octubre, 1 pago" }).getAttribute("aria-selected")).toBe("true");
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "End" });
    expect(within(grid).getByRole("gridcell", { name: "11 de octubre" }).getAttribute("aria-selected")).toBe("true");
  });

  it("no se sale del mes: en el primer día ArrowLeft y ArrowUp lo dejan en el 1", async () => {
    montar(puerto(), "2026-10-01");
    const { grid, celda } = await celdaActiva();

    fireEvent.keyDown(celda, { key: "ArrowLeft" });
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "ArrowUp" });
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "Home" });

    expect(within(grid).getByRole("gridcell", { name: "1 de octubre, 1 corte" }).getAttribute("aria-selected")).toBe("true");
  });

  it("no se sale del mes: en el último día ArrowRight, ArrowDown y Fin lo dejan en el 31", async () => {
    montar(puerto(), "2026-10-31");
    const { grid, celda } = await celdaActiva();

    fireEvent.keyDown(celda, { key: "ArrowRight" });
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "ArrowDown" });
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: "End" });

    expect(within(grid).getByRole("gridcell", { name: "31 de octubre" }).getAttribute("aria-selected")).toBe("true");
  });

  it("RePág y AvPág cambian de mes conservando el día", async () => {
    const consulta = vi.fn(async (desde: string) => (desde.startsWith("2026-10") ? octubre : []));
    montar(puerto(consulta));
    const { celda } = await celdaActiva();

    fireEvent.keyDown(celda, { key: "PageDown" });

    expect(await screen.findByRole("grid", { name: "Noviembre 2026" })).toBeTruthy();
    expect(consulta).toHaveBeenCalledWith("2026-11-01", 30);
    expect(screen.getByRole("gridcell", { name: "5 de noviembre" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("Sin pagos ni cortes este día.")).toBeTruthy();
  });
});

describe("CalendarioPagos · mes, carga y error", () => {
  it("las flechas del encabezado cambian de mes y vuelven a consultar", async () => {
    const consulta = vi.fn(async (_desde: string, _dias: number) => [] as EventoCalendario[]);
    montar(puerto(consulta));
    await screen.findByRole("grid", { name: "Octubre 2026" });

    fireEvent.click(screen.getByRole("button", { name: "Mes anterior del calendario" }));
    expect(await screen.findByRole("grid", { name: "Septiembre 2026" })).toBeTruthy();
    expect(consulta).toHaveBeenLastCalledWith("2026-09-01", 30);

    fireEvent.click(screen.getByRole("button", { name: "Mes siguiente del calendario" }));
    fireEvent.click(screen.getByRole("button", { name: "Mes siguiente del calendario" }));
    expect(await screen.findByRole("grid", { name: "Noviembre 2026" })).toBeTruthy();
  });

  it("mientras carga muestra un esqueleto con aviso accesible", async () => {
    const consulta = vi.fn(() => new Promise<EventoCalendario[]>(() => {}));
    const { container } = montar(puerto(consulta));

    expect((await screen.findByRole("status")).textContent).toBe("Cargando el calendario…");
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    expect(screen.queryByRole("grid")).toBeNull();
  });

  it("si falla ofrece Reintentar y luego muestra el calendario", async () => {
    const consulta = vi
      .fn<(desde: string, dias: number) => Promise<EventoCalendario[]>>()
      .mockRejectedValueOnce(new Error("La API respondió HTTP 503."))
      .mockResolvedValue(octubre);
    montar(puerto(consulta));

    expect((await screen.findByRole("alert")).textContent).toBe("La API respondió HTTP 503.");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByRole("grid", { name: "Octubre 2026" })).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("vuelve a consultar cuando cambian las tarjetas (p. ej. se desactiva una)", async () => {
    const consulta = vi.fn(async (_desde: string, _dias: number) => octubre);
    const finanzas = puerto(consulta);
    const { rerender } = montar(finanzas);
    await screen.findByRole("grid", { name: "Octubre 2026" });
    const llamadas = consulta.mock.calls.length;

    rerender(
      <CalendarioPagos
        fechaInicial="2026-10-05"
        finanzas={finanzas}
        hoy={hoy}
        tarjetas={[{ ...tarjetas[0], activa: false }, tarjetas[1]]}
      />,
    );

    await waitFor(() => expect(consulta.mock.calls.length).toBeGreaterThan(llamadas));
  });
});

// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  MovimientoFinanciero,
  ResumenCategoriaFinanciera,
} from "../domain/MovimientoFinanciero";
import type { Tarjeta } from "../domain/Tarjeta";
import { FinanzasPage } from "./FinanzasPage";

const periodoPrueba = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

const authFake = vi.hoisted(() => ({
  updateToken: vi.fn(async () => "token-finanzas-prueba"),
  init: vi.fn(async () => null),
  logout: vi.fn(async () => {}),
}));

const chatFake = vi.hoisted(() => ({
  activeSessionId: null as string | null,
  enviarMensaje: vi.fn(async () => "sesion-chat"),
  obtenerSesion: vi.fn(async () => []),
  refreshSessions: vi.fn(async () => {}),
  setActiveSessionId: vi.fn(),
}));

vi.mock("../infrastructure/adapters/KeycloakAuthAdapter", () => ({
  keycloakAuthAdapter: authFake,
}));

vi.mock("./useChatSessions", () => ({
  useChatSessions: () => chatFake,
}));

const movimientos: MovimientoFinanciero[] = [
  {
    id: "gasto-mxn",
    fecha: `${periodoPrueba}-03`,
    monto: 1250,
    moneda: "MXN",
    comercio: "Supermercado MXN",
    categoria: "Alimentos MXN",
    tarjetaId: null,
    origen: "MANUAL",
    tipo: "GASTO",
  },
  {
    id: "gasto-usd",
    fecha: `${periodoPrueba}-04`,
    monto: 32,
    moneda: "USD",
    comercio: "Comercio gasto USD",
    categoria: "Viajes USD",
    tarjetaId: null,
    origen: "IMPORT",
    tipo: "GASTO",
  },
  {
    id: "ingreso-mxn",
    fecha: `${periodoPrueba}-05`,
    monto: 24000,
    moneda: "MXN",
    comercio: "Nómina MXN",
    categoria: "Sueldo MXN",
    tarjetaId: null,
    origen: "NOTIFICACION",
    tipo: "INGRESO",
  },
  {
    id: "ingreso-usd",
    fecha: `${periodoPrueba}-06`,
    monto: 80,
    moneda: "USD",
    comercio: "Consultoría USD",
    categoria: "Servicios USD",
    tarjetaId: null,
    origen: "MANUAL",
    tipo: "INGRESO",
  },
];

const resumen: ResumenCategoriaFinanciera[] = [
  { categoria: "Alimentos MXN", tipo: "GASTO", moneda: "MXN", total: 1250 },
  { categoria: "Viajes USD", tipo: "GASTO", moneda: "USD", total: 32 },
  { categoria: "Sueldo MXN", tipo: "INGRESO", moneda: "MXN", total: 24000 },
  { categoria: "Servicios USD", tipo: "INGRESO", moneda: "USD", total: 80 },
];

const tarjetas: Tarjeta[] = [
  {
    id: "tarjeta-1",
    alias: "Tarjeta principal",
    ultimos4: "0042",
    diaCorte: 10,
    diaPago: 25,
    permiteLiquidarMsiAnticipado: true,
    activa: true,
  },
];

beforeEach(() => {
  authFake.updateToken.mockReset().mockResolvedValue("token-finanzas-prueba");
  chatFake.activeSessionId = null;
  chatFake.enviarMensaje.mockReset().mockResolvedValue("sesion-chat");
  chatFake.obtenerSesion.mockReset().mockResolvedValue([]);
  chatFake.refreshSessions.mockReset().mockResolvedValue();
  chatFake.setActiveSessionId.mockReset();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) =>
      respuestaFinanzas(String(input), { movimientos, resumen, tarjetas }),
    ),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("FinanzasPage", () => {
  it("muestra carga hasta obtener movimientos, resumen y tarjetas mediante peticiones autenticadas", async () => {
    let liberarRespuestas!: () => void;
    const respuestasListas = new Promise<void>((resolve) => {
      liberarRespuestas = resolve;
    });
    const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
      await respuestasListas;
      return respuestaFinanzas(String(input), { movimientos, resumen, tarjetas });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<FinanzasPage />);

    expect(screen.getByRole("status").textContent).toContain(
      "Cargando movimientos, resumen y tarjetas",
    );
    expect(screen.queryByRole("heading", { name: "Gastos" })).toBeNull();

    liberarRespuestas();

    expect(await screen.findByRole("heading", { name: "Tarjetas" })).toBeTruthy();
    expect(await screen.findByText("Tarjeta principal")).toBeTruthy();
    expect(await screen.findByText("Supermercado MXN")).toBeTruthy();
    expect(authFake.updateToken).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenCalledTimes(3);

    const solicitudes = fetchMock.mock.calls.map(([ruta, init]) => ({
      ruta: String(ruta),
      autorizacion: new Headers(init?.headers).get("Authorization"),
    }));
    expect(solicitudes.map(({ ruta }) => ruta).sort()).toEqual(
      [
        "/api/finanzas/movimientos",
        `/api/finanzas/movimientos/resumen-mensual?periodo=${periodoPrueba}`,
        "/api/finanzas/tarjetas",
      ].sort(),
    );
    expect(solicitudes.every(({ autorizacion }) => autorizacion === "Bearer token-finanzas-prueba")).toBe(
      true,
    );
  });

  it("presenta movimientos y resúmenes separados por tipo y moneda sin recalcular importes", async () => {
    render(<FinanzasPage />);

    const tablaGastosMxn = await screen.findByRole("table", {
      name: "Gastos del periodo en MXN",
    });
    expect(within(tablaGastosMxn).getByText("Supermercado MXN")).toBeTruthy();
    expect(within(tablaGastosMxn).queryByText("Nómina MXN")).toBeNull();

    const tablaGastosUsd = screen.getByRole("table", {
      name: "Gastos del periodo en USD",
    });
    expect(within(tablaGastosUsd).getByText("Comercio gasto USD")).toBeTruthy();
    expect(within(tablaGastosUsd).queryByText("Consultoría USD")).toBeNull();

    const tablaIngresosMxn = screen.getByRole("table", {
      name: "Ingresos del periodo en MXN",
    });
    expect(within(tablaIngresosMxn).getByText("Nómina MXN")).toBeTruthy();
    expect(within(tablaIngresosMxn).queryByText("Supermercado MXN")).toBeNull();

    const tablaIngresosUsd = screen.getByRole("table", {
      name: "Ingresos del periodo en USD",
    });
    expect(within(tablaIngresosUsd).getByText("Consultoría USD")).toBeTruthy();
    expect(within(tablaIngresosUsd).queryByText("Comercio gasto USD")).toBeNull();

    expect(
      await screen.findByRole("list", {
        name: "Importes de gastos por categoría en MXN",
      }),
    ).toBeTruthy();
    const gastoResumenMxn = screen.getByRole("list", {
      name: "Importes de gastos por categoría en MXN",
    });
    expect(within(gastoResumenMxn).getByText("Alimentos MXN")).toBeTruthy();
    expect(within(gastoResumenMxn).queryByText("Sueldo MXN")).toBeNull();

    const gastoResumenUsd = screen.getByRole("list", {
      name: "Importes de gastos por categoría en USD",
    });
    expect(within(gastoResumenUsd).getByText("Viajes USD")).toBeTruthy();
    expect(within(gastoResumenUsd).queryByText("Servicios USD")).toBeNull();

    const ingresoResumenMxn = screen.getByRole("list", {
      name: "Importes de ingresos por categoría en MXN",
    });
    expect(within(ingresoResumenMxn).getByText("Sueldo MXN")).toBeTruthy();
    expect(within(ingresoResumenMxn).queryByText("Alimentos MXN")).toBeNull();

    const ingresoResumenUsd = screen.getByRole("list", {
      name: "Importes de ingresos por categoría en USD",
    });
    expect(within(ingresoResumenUsd).getByText("Servicios USD")).toBeTruthy();
    expect(within(ingresoResumenUsd).queryByText("Viajes USD")).toBeNull();
  });

  it("presenta alias, solo los últimos cuatro enmascarados, corte, pago y estado de la tarjeta", async () => {
    render(<FinanzasPage />);

    const tablaTarjetas = await screen.findByRole("table", {
      name: "Tarjetas registradas",
    });
    const filaTarjeta = within(tablaTarjetas).getByRole("row", {
      name: /Tarjeta principal/,
    });

    expect(within(filaTarjeta).getByRole("rowheader").textContent).toBe(
      "Tarjeta principal",
    );
    expect(within(filaTarjeta).getByText(/^••••\s0042$/).textContent).toBe(
      "•••• 0042",
    );
    expect(within(filaTarjeta).getByText("Día 10")).toBeTruthy();
    expect(within(filaTarjeta).getByText("Día 25")).toBeTruthy();
    expect(within(filaTarjeta).getByText("Activa")).toBeTruthy();
  });

  it("presenta estados vacíos cuando la API no devuelve movimientos, resumen ni tarjetas", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) =>
        respuestaFinanzas(String(input), {
          movimientos: [],
          resumen: [],
          tarjetas: [],
        }),
      ),
    );

    render(<FinanzasPage />);

    expect(
      await screen.findByText("No hay gastos para este periodo.", { exact: true }),
    ).toBeTruthy();
    expect(screen.getByText("No hay ingresos para este periodo.", { exact: true })).toBeTruthy();
    expect(screen.getByText("No hay tarjetas registradas.", { exact: true })).toBeTruthy();
    expect(
      await screen.findAllByText("No hay importes por categoría para este periodo."),
    ).toHaveLength(2);
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("muestra el error de carga y permite reintentar las consultas", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 503 }))
      .mockImplementation(async (input: RequestInfo | URL) =>
        respuestaFinanzas(String(input), { movimientos, resumen, tarjetas }),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<FinanzasPage />);

    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "La API respondió HTTP 503.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("Tarjeta principal")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });

  it("previsualiza el CSV solo en Finanzas y refresca la vista al confirmar explícitamente", async () => {
    const importado: MovimientoFinanciero = {
      id: "movimiento-importado",
      fecha: `${periodoPrueba}-07`,
      monto: 45,
      moneda: "MXN",
      comercio: "Comercio importado",
      categoria: "Compras",
      tarjetaId: null,
      origen: "IMPORT",
      tipo: "GASTO",
    };
    let confirmada = false;
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const ruta = String(input);
        if (ruta === "/api/finanzas/importaciones/preview") {
          return new Response(
            JSON.stringify({
              importId: "importacion-1",
              totalRegistros: 1,
              movimientos: [
                {
                  fecha: importado.fecha,
                  monto: importado.monto,
                  moneda: importado.moneda,
                  comercio: importado.comercio,
                  categoria: importado.categoria,
                  tarjetaId: importado.tarjetaId,
                  tipo: importado.tipo,
                },
              ],
            }),
            { status: 200 },
          );
        }
        if (ruta === "/api/finanzas/importaciones/importacion-1/confirmar") {
          expect(init?.method).toBe("POST");
          confirmada = true;
          return new Response(JSON.stringify({ totalRegistros: 1 }), { status: 200 });
        }
        return respuestaFinanzas(ruta, {
          movimientos: confirmada ? [...movimientos, importado] : movimientos,
          resumen,
          tarjetas,
        });
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<FinanzasPage />);
    expect(await screen.findByText("Tarjeta principal")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Confirmar importación" })).toBeNull();

    const archivoCsv = new File(["fecha,monto"], "movimientos.csv", {
      type: "text/csv",
    });
    fireEvent.change(screen.getByLabelText("Archivo CSV"), {
      target: { files: [archivoCsv] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Previsualizar CSV" }));

    const tablaPreview = await screen.findByRole("table", {
      name: "Previsualización de movimientos",
    });
    expect(within(tablaPreview).getByText("Comercio importado")).toBeTruthy();
    expect(
      fetchMock.mock.calls.some(([ruta]) =>
        String(ruta).includes("/confirmar"),
      ),
    ).toBe(false);
    expect(
      fetchMock.mock.calls.map(([ruta]) => String(ruta)).filter((ruta) => ruta.startsWith("/adk/")),
    ).toEqual([]);
    expect(chatFake.enviarMensaje).not.toHaveBeenCalled();

    const previewCall = fetchMock.mock.calls.find(
      ([ruta]) => String(ruta) === "/api/finanzas/importaciones/preview",
    );
    expect(previewCall).toBeDefined();
    const previewInit = previewCall?.[1];
    expect(previewInit?.method).toBe("POST");
    expect(previewInit?.body).toBeInstanceOf(FormData);
    expect(Array.from((previewInit?.body as FormData).keys())).toEqual(["archivo"]);
    const archivoEnviado = (previewInit?.body as FormData).get("archivo");
    expect(archivoEnviado).toBeInstanceOf(File);
    expect((archivoEnviado as File).name).toBe(archivoCsv.name);
    expect(new Headers(previewInit?.headers).has("Content-Type")).toBe(false);
    expect(new Headers(previewInit?.headers).get("Authorization")).toBe(
      "Bearer token-finanzas-prueba",
    );

    fireEvent.click(screen.getByRole("button", { name: "Confirmar importación" }));
    expect(await screen.findByRole("status")).toHaveProperty(
      "textContent",
      "Importación confirmada: 1 registros.",
    );
    expect(await screen.findByText("Comercio importado")).toBeTruthy();
    expect(
      fetchMock.mock.calls.filter(
        ([ruta]) => String(ruta) === "/api/finanzas/movimientos",
      ),
    ).toHaveLength(2);
  });

  it("muestra los errores de preview sin habilitar una confirmación", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input) === "/api/finanzas/importaciones/preview") {
        return new Response("", { status: 503 });
      }
      return respuestaFinanzas(String(input), { movimientos, resumen, tarjetas });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<FinanzasPage />);
    await screen.findByText("Tarjeta principal");
    fireEvent.change(screen.getByLabelText("Archivo CSV"), {
      target: {
        files: [new File(["fecha,monto"], "movimientos.csv", { type: "text/csv" })],
      },
    });
    fireEvent.click(screen.getByRole("button", { name: "Previsualizar CSV" }));

    expect(await screen.findByRole("alert")).toHaveProperty(
      "textContent",
      "La API respondió HTTP 503.",
    );
    expect(screen.queryByRole("button", { name: "Confirmar importación" })).toBeNull();
    expect(chatFake.enviarMensaje).not.toHaveBeenCalled();
  });
});

function respuestaFinanzas(
  ruta: string,
  datos: {
    movimientos: MovimientoFinanciero[];
    resumen: ResumenCategoriaFinanciera[];
    tarjetas: Tarjeta[];
  },
): Response {
  if (ruta === "/api/finanzas/movimientos") {
    return new Response(JSON.stringify(datos.movimientos), { status: 200 });
  }
  if (ruta.startsWith("/api/finanzas/movimientos/resumen-mensual?")) {
    return new Response(JSON.stringify(datos.resumen), { status: 200 });
  }
  if (ruta === "/api/finanzas/tarjetas") {
    return new Response(JSON.stringify(datos.tarjetas), { status: 200 });
  }
  return new Response("", { status: 404 });
}

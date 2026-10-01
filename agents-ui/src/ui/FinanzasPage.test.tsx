// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EventoCalendario } from "../domain/EventoCalendario";
import type { Mensaje } from "../domain/Mensaje";
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
  finanzasSessionId: null as string | null,
  enviarMensaje: vi.fn(async () => "sesion-finanzas"),
  obtenerSesion: vi.fn(async (): Promise<Mensaje[]> => []),
  refreshSessions: vi.fn(async () => {}),
  setFinanzasSessionId: vi.fn(),
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
    tarjetaId: "tarjeta-1",
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
];

const resumen: ResumenCategoriaFinanciera[] = [
  { categoria: "Vivienda", tipo: "GASTO", moneda: "MXN", total: 7500 },
  { categoria: "Comida", tipo: "GASTO", moneda: "MXN", total: 4200 },
  { categoria: "Viajes USD", tipo: "GASTO", moneda: "USD", total: 32 },
  { categoria: "Sueldo MXN", tipo: "INGRESO", moneda: "MXN", total: 24000 },
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

const eventos: EventoCalendario[] = [
  { fecha: "2030-10-05", tipo: "PAGO", alias: "Tarjeta principal" },
  { fecha: "2030-10-15", tipo: "CORTE", alias: "Tarjeta principal" },
];

interface DatosFalsos {
  movimientos: MovimientoFinanciero[];
  resumen: ResumenCategoriaFinanciera[];
  tarjetas: Tarjeta[];
  eventos: EventoCalendario[];
}

const datosBase: DatosFalsos = { movimientos, resumen, tarjetas, eventos };

function renderizar(ruta = "/finanzas/resumen") {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route element={<FinanzasPage />} path="/finanzas/:tab" />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  authFake.updateToken.mockReset().mockResolvedValue("token-finanzas-prueba");
  chatFake.finanzasSessionId = null;
  chatFake.enviarMensaje.mockReset().mockResolvedValue("sesion-finanzas");
  chatFake.obtenerSesion.mockReset().mockResolvedValue([]);
  chatFake.refreshSessions.mockReset().mockResolvedValue();
  chatFake.setFinanzasSessionId.mockReset();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => respuestaFinanzas(String(input), datosBase)),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("FinanzasPage · carga y resumen", () => {
  it("muestra carga y consulta movimientos, resumen, tarjetas y calendario con token", async () => {
    let liberar!: () => void;
    const listas = new Promise<void>((resolve) => {
      liberar = resolve;
    });
    const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
      await listas;
      return respuestaFinanzas(String(input), datosBase);
    });
    vi.stubGlobal("fetch", fetchMock);

    renderizar();

    expect(screen.getByRole("status").textContent).toContain(
      "Cargando movimientos, resumen y tarjetas",
    );
    liberar();
    expect(await screen.findByRole("heading", { name: "Gastos por categoría" })).toBeTruthy();

    const solicitudes = fetchMock.mock.calls.map(([ruta, init]) => ({
      ruta: String(ruta),
      autorizacion: new Headers(init?.headers).get("Authorization"),
    }));
    const rutas = solicitudes.map(({ ruta }) => ruta);
    expect(rutas).toContain("/api/finanzas/movimientos");
    expect(rutas).toContain(`/api/finanzas/movimientos/resumen-mensual?periodo=${periodoPrueba}`);
    expect(rutas).toContain("/api/finanzas/tarjetas");
    expect(rutas.some((ruta) => /^\/api\/finanzas\/calendario\?desde=\d{4}-\d{2}-\d{2}&dias=30$/.test(ruta))).toBe(
      true,
    );
    expect(solicitudes.every(({ autorizacion }) => autorizacion === "Bearer token-finanzas-prueba")).toBe(
      true,
    );
  });

  it("presenta el próximo pago, barras por categoría, origen y estados vacíos sin calcular totales", async () => {
    renderizar();

    const proximo = (await screen.findByText("Próximo pago")).closest("section") as HTMLElement;
    expect(within(proximo).getByText("Tarjeta principal")).toBeTruthy();

    const categorias = screen.getByRole("list", {
      name: "Importes de gastos por categoría en MXN",
    });
    expect(within(categorias).getByText("Vivienda")).toBeTruthy();
    expect(within(categorias).getByText("Comida")).toBeTruthy();
    expect(within(categorias).queryByText("Viajes USD")).toBeNull();

    const ultimos = screen.getByRole("table", { name: "Últimos movimientos en MXN" });
    expect(within(ultimos).getByText("manual")).toBeTruthy();
    expect(within(ultimos).getByText("notificación")).toBeTruthy();

    expect(screen.getAllByText(/Sin datos todavía/).length).toBeGreaterThanOrEqual(4);
    expect(screen.getByRole("link", { name: "Ver tarjetas" }).getAttribute("href")).toBe(
      "/finanzas/tarjetas",
    );
    expect(screen.getByRole("link", { name: "Ver todos" }).getAttribute("href")).toBe(
      "/finanzas/gastos",
    );
  });

  it("el alternador de moneda filtra lo mostrado sin sumar monedas", async () => {
    renderizar();
    await screen.findByRole("list", { name: "Importes de gastos por categoría en MXN" });

    fireEvent.click(screen.getByRole("button", { name: "USD" }));

    expect(screen.getByRole("button", { name: "USD" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "MXN" }).getAttribute("aria-pressed")).toBe("false");
    const categoriasUsd = screen.getByRole("list", {
      name: "Importes de gastos por categoría en USD",
    });
    expect(within(categoriasUsd).getByText("Viajes USD")).toBeTruthy();
    expect(within(categoriasUsd).queryByText("Vivienda")).toBeNull();
  });

  it("muestra el error de carga y permite reintentar", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 503 }))
      .mockImplementation(async (input: RequestInfo | URL) =>
        respuestaFinanzas(String(input), datosBase),
      );
    vi.stubGlobal("fetch", fetchMock);

    renderizar();

    expect((await screen.findByRole("alert")).textContent).toBe("La API respondió HTTP 503.");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByRole("heading", { name: "Gastos por categoría" })).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(8);
  });
});

describe("FinanzasPage · pestañas por ruta", () => {
  it.each([
    ["resumen", "Resumen"],
    ["gastos", "Gastos"],
    ["ingresos", "Ingresos"],
    ["tarjetas", "Tarjetas y pagos"],
    ["trading-mx", "Trading MX"],
    ["trading-usa", "Trading USA"],
  ])("la ruta /finanzas/%s marca la pestaña %s", async (id, etiqueta) => {
    renderizar(`/finanzas/${id}`);

    const lista = screen.getByRole("tablist", { name: "Secciones de finanzas" });
    expect(within(lista).getAllByRole("tab")).toHaveLength(6);
    const activa = within(lista).getByRole("tab", { name: etiqueta });
    expect(activa.getAttribute("aria-selected")).toBe("true");
    expect(activa.getAttribute("href")).toBe(`/finanzas/${id}`);
    expect(within(lista).getAllByRole("tab", { selected: true })).toHaveLength(1);
    await screen.findByRole("tabpanel");
  });

  it("una pestaña desconocida cae en resumen", async () => {
    renderizar("/finanzas/inexistente");

    expect(
      (await screen.findByRole("tab", { name: "Resumen" })).getAttribute("aria-selected"),
    ).toBe("true");
  });

  it("Gastos e Ingresos muestran tablas por tipo en la moneda elegida", async () => {
    renderizar("/finanzas/gastos");

    const gastos = await screen.findByRole("table", { name: "Gastos del periodo en MXN" });
    expect(within(gastos).getByText("Supermercado MXN")).toBeTruthy();
    expect(within(gastos).getByText("••••0042")).toBeTruthy();
    expect(within(gastos).getByText("manual")).toBeTruthy();
    expect(within(gastos).queryByText("Nómina MXN")).toBeNull();

    fireEvent.click(screen.getByRole("tab", { name: "Ingresos" }));
    const ingresos = await screen.findByRole("table", { name: "Ingresos del periodo en MXN" });
    expect(within(ingresos).getByText("Nómina MXN")).toBeTruthy();
    expect(within(ingresos).getByText("notificación")).toBeTruthy();
  });

  it("Tarjetas muestra la tabla con switch y el calendario", async () => {
    renderizar("/finanzas/tarjetas");

    expect(await screen.findByRole("switch", { name: "Tarjeta principal activa" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Próximos 30 días" })).toBeTruthy();
  });

  it.each(["trading-mx", "trading-usa"])("%s muestra el estado vacío de FIN-04", async (id) => {
    renderizar(`/finanzas/${id}`);

    expect((await screen.findByRole("heading", { name: /Aún no hay portafolio/ })).textContent).toContain(
      id === "trading-mx" ? "Trading MX" : "Trading USA",
    );
  });
});

describe("FinanzasPage · panel del asistente", () => {
  it("se pliega con Cerrar asistente y se reabre con el botón Asistente", async () => {
    renderizar();
    expect(screen.getByRole("complementary", { name: "Asistente de finanzas" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Asistente" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Cerrar asistente" }));

    expect(screen.queryByRole("complementary", { name: "Asistente de finanzas" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Asistente" }));
    expect(screen.getByRole("complementary", { name: "Asistente de finanzas" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Asistente" })).toBeNull();
    await screen.findByRole("tabpanel");
  });

  it("pinta las tablas Markdown del agente y retoma la sesión de finanzas", async () => {
    chatFake.finanzasSessionId = "sesion-finanzas";
    chatFake.obtenerSesion.mockResolvedValue([
      { rol: "usuario", texto: "Registra mis tarjetas", fecha: new Date(1000) },
      {
        rol: "agente",
        texto: "Esto voy a guardar:\n\n| tarjeta | corte |\n| --- | --- |\n| Tarjeta A | 15 |",
        fecha: new Date(2000),
      },
    ]);

    renderizar();

    const panel = screen.getByRole("complementary", { name: "Asistente de finanzas" });
    const tabla = await within(panel).findByRole("table");
    expect(within(tabla).getByRole("columnheader", { name: "tarjeta" })).toBeTruthy();
    expect(within(tabla).getByRole("cell", { name: "Tarjeta A" })).toBeTruthy();
    expect(chatFake.obtenerSesion).toHaveBeenCalledWith("sesion-finanzas");
    await screen.findByRole("tabpanel");
  });

  it("envía mensajes con origen finanzas y guarda la sesión del panel", async () => {
    renderizar();
    await screen.findByRole("tabpanel");

    fireEvent.change(screen.getByLabelText("Mensaje para el asistente de finanzas"), {
      target: { value: "¿Cuánto gasté?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

    await vi.waitFor(() => expect(chatFake.setFinanzasSessionId).toHaveBeenCalledWith("sesion-finanzas"));
    expect(chatFake.enviarMensaje).toHaveBeenCalledWith(
      "¿Cuánto gasté?",
      null,
      expect.any(Function),
      "finanzas",
    );
  });

  it("adjunta un CSV desde el composer, previsualiza, confirma las N y recarga sin llamar a /adk/", async () => {
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
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
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
        ...datosBase,
        movimientos: confirmada ? [...movimientos, importado] : movimientos,
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    renderizar();
    await screen.findByRole("tabpanel");
    expect(screen.queryByText("Importar CSV")).toBeNull();
    expect(screen.queryByRole("button", { name: /Confirmar las/ })).toBeNull();
    expect(screen.getByText("CSV · se procesa en finanzas")).toBeTruthy();

    const archivoCsv = new File(["fecha,monto"], "movimientos.csv", { type: "text/csv" });
    fireEvent.change(screen.getByLabelText("Archivo CSV"), { target: { files: [archivoCsv] } });

    const tabla = await screen.findByRole("table", { name: "Previsualización de movimientos" });
    expect(within(tabla).getByText("Comercio importado")).toBeTruthy();
    expect(screen.getByText("movimientos.csv")).toBeTruthy();
    expect(fetchMock.mock.calls.some(([ruta]) => String(ruta).includes("/confirmar"))).toBe(false);

    const previewInit = fetchMock.mock.calls.find(
      ([ruta]) => String(ruta) === "/api/finanzas/importaciones/preview",
    )?.[1];
    expect(previewInit?.method).toBe("POST");
    expect(previewInit?.body).toBeInstanceOf(FormData);
    expect(Array.from((previewInit?.body as FormData).keys())).toEqual(["archivo"]);
    expect(new Headers(previewInit?.headers).get("Authorization")).toBe(
      "Bearer token-finanzas-prueba",
    );

    fireEvent.click(screen.getByRole("button", { name: "Confirmar las 1" }));

    expect(
      await screen.findByText("Importación confirmada: 1 registros."),
    ).toBeTruthy();
    await vi.waitFor(() =>
      expect(
        fetchMock.mock.calls.filter(([ruta]) => String(ruta) === "/api/finanzas/movimientos"),
      ).toHaveLength(2),
    );
    expect(
      fetchMock.mock.calls.map(([ruta]) => String(ruta)).filter((ruta) => ruta.startsWith("/adk/")),
    ).toEqual([]);
    expect(chatFake.enviarMensaje).not.toHaveBeenCalled();
  });

  it("muestra los errores de preview sin habilitar la confirmación", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input) === "/api/finanzas/importaciones/preview") {
        return new Response("", { status: 503 });
      }
      return respuestaFinanzas(String(input), datosBase);
    });
    vi.stubGlobal("fetch", fetchMock);

    renderizar();
    await screen.findByRole("tabpanel");
    fireEvent.change(screen.getByLabelText("Archivo CSV"), {
      target: { files: [new File(["fecha,monto"], "movimientos.csv", { type: "text/csv" })] },
    });

    expect((await screen.findByRole("alert")).textContent).toBe("La API respondió HTTP 503.");
    expect(screen.queryByRole("button", { name: /Confirmar las/ })).toBeNull();
    expect(chatFake.enviarMensaje).not.toHaveBeenCalled();
  });

  it("descarta la previsualización sin confirmar", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input) === "/api/finanzas/importaciones/preview") {
        return new Response(
          JSON.stringify({
            importId: "importacion-2",
            totalRegistros: 1,
            movimientos: [
              {
                fecha: `${periodoPrueba}-07`,
                monto: 10,
                moneda: "MXN",
                comercio: "Tienda",
                categoria: "Compras",
                tarjetaId: null,
                tipo: "GASTO",
              },
            ],
          }),
          { status: 200 },
        );
      }
      return respuestaFinanzas(String(input), datosBase);
    });
    vi.stubGlobal("fetch", fetchMock);

    renderizar();
    await screen.findByRole("tabpanel");
    fireEvent.change(screen.getByLabelText("Archivo CSV"), {
      target: { files: [new File(["x"], "movimientos.csv", { type: "text/csv" })] },
    });
    fireEvent.click(await screen.findByRole("button", { name: "Descartar" }));

    expect(screen.queryByRole("table", { name: "Previsualización de movimientos" })).toBeNull();
    expect(fetchMock.mock.calls.some(([ruta]) => String(ruta).includes("/confirmar"))).toBe(false);
  });

  it("rechaza archivos que no son CSV sin llamar a la API", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) =>
      respuestaFinanzas(String(input), datosBase),
    );
    vi.stubGlobal("fetch", fetchMock);

    renderizar();
    await screen.findByRole("tabpanel");
    const llamadasAntes = fetchMock.mock.calls.length;
    fireEvent.change(screen.getByLabelText("Archivo CSV"), {
      target: { files: [new File(["x"], "estado.pdf", { type: "application/pdf" })] },
    });

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Selecciona un archivo con extensión .csv.",
    );
    expect(fetchMock.mock.calls).toHaveLength(llamadasAntes);
  });
});

function simularVistaEstrecha() {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((consulta: string) => ({
      matches: true,
      media: consulta,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

describe("FinanzasPage · asistente como drawer bajo 980px", () => {
  it("es un diálogo modal solo en vista estrecha; en escritorio es una región sin aria-modal", async () => {
    renderizar();
    const region = screen.getByRole("complementary", { name: "Asistente de finanzas" });
    expect(region.getAttribute("aria-modal")).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByTestId("fondo-asistente")).toBeNull();
    cleanup();

    simularVistaEstrecha();
    renderizar();
    fireEvent.click(await screen.findByRole("button", { name: "Asistente" }));

    const dialogo = screen.getByRole("dialog", { name: "Asistente de finanzas" });
    expect(dialogo.getAttribute("aria-modal")).toBe("true");
    expect(screen.queryByRole("complementary")).toBeNull();
    expect(screen.getByTestId("fondo-asistente")).toBeTruthy();
  });

  it("empieza cerrado, abre con el foco dentro y Escape cierra devolviendo el foco al botón", async () => {
    simularVistaEstrecha();
    renderizar();
    expect(screen.queryByRole("dialog")).toBeNull();

    const abrir = screen.getByRole("button", { name: "Asistente" });
    abrir.focus();
    fireEvent.click(abrir);
    const dialogo = screen.getByRole("dialog", { name: "Asistente de finanzas" });
    expect(dialogo.contains(document.activeElement)).toBe(true);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Asistente" }));
  });

  it("el clic en el fondo cierra el drawer y devuelve el foco al botón Asistente", async () => {
    simularVistaEstrecha();
    renderizar();
    fireEvent.click(screen.getByRole("button", { name: "Asistente" }));

    fireEvent.click(screen.getByTestId("fondo-asistente"));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByTestId("fondo-asistente")).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Asistente" }));
  });

  it("Cerrar asistente devuelve el foco al botón Asistente", () => {
    simularVistaEstrecha();
    renderizar();
    fireEvent.click(screen.getByRole("button", { name: "Asistente" }));

    fireEvent.click(screen.getByRole("button", { name: "Cerrar asistente" }));

    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Asistente" }));
  });

  it("atrapa el foco con Tab y Shift+Tab dentro del drawer", () => {
    simularVistaEstrecha();
    renderizar();
    fireEvent.click(screen.getByRole("button", { name: "Asistente" }));
    const dialogo = screen.getByRole("dialog", { name: "Asistente de finanzas" });
    const cerrar = within(dialogo).getByRole("button", { name: "Cerrar asistente" });
    const adjuntar = within(dialogo).getByRole("button", { name: "Adjuntar archivo" });

    // Con el composer vacío el botón Enviar está deshabilitado: Adjuntar es el último control.
    adjuntar.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(cerrar);

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(adjuntar);

    document.body.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(cerrar);
  });

  it("conserva el panel montado al cerrar: el borrador del composer sigue ahí al reabrir", () => {
    simularVistaEstrecha();
    renderizar();
    fireEvent.click(screen.getByRole("button", { name: "Asistente" }));
    fireEvent.change(screen.getByLabelText("Mensaje para el asistente de finanzas"), {
      target: { value: "borrador" },
    });

    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "Asistente" }));

    expect(
      (screen.getByLabelText("Mensaje para el asistente de finanzas") as HTMLTextAreaElement).value,
    ).toBe("borrador");
  });
});

describe("FinanzasPage · asistente en escritorio y pestañas", () => {
  it("al cerrar mueve el foco al botón Asistente y al reabrir lo lleva al panel", () => {
    renderizar();

    fireEvent.click(screen.getByRole("button", { name: "Cerrar asistente" }));
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Asistente" }));

    fireEvent.click(screen.getByRole("button", { name: "Asistente" }));
    const panel = screen.getByRole("complementary", { name: "Asistente de finanzas" });
    expect(document.activeElement).toBe(panel);
  });

  it("enlaza pestañas y panel con id, aria-controls y aria-labelledby, también al cargar", () => {
    renderizar("/finanzas/gastos");

    const panel = screen.getByRole("tabpanel");
    const activa = screen.getByRole("tab", { name: "Gastos" });
    expect(panel.getAttribute("aria-labelledby")).toBe(activa.id);
    expect(activa.getAttribute("aria-controls")).toBe(panel.id);
    expect(within(panel).getByRole("status")).toBeTruthy();
  });

  it("muestra el error dentro del panel de pestañas", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 500 })));
    renderizar();

    const alerta = await screen.findByRole("alert");
    expect(within(screen.getByRole("tabpanel")).getByRole("alert")).toBe(alerta);
  });
});

function respuestaFinanzas(ruta: string, datos: DatosFalsos): Response {
  if (ruta === "/api/finanzas/movimientos") {
    return new Response(JSON.stringify(datos.movimientos), { status: 200 });
  }
  if (ruta.startsWith("/api/finanzas/movimientos/resumen-mensual?")) {
    return new Response(JSON.stringify(datos.resumen), { status: 200 });
  }
  if (ruta === "/api/finanzas/tarjetas") {
    return new Response(JSON.stringify(datos.tarjetas), { status: 200 });
  }
  if (ruta.startsWith("/api/finanzas/calendario?")) {
    return new Response(JSON.stringify(datos.eventos), { status: 200 });
  }
  return new Response("", { status: 404 });
}

describe("FinanzasPage · botón Asistente y pestañas en angosto", () => {
  it("el botón Asistente sigue en el encabezado con el drawer abierto y abre el chat", () => {
    simularVistaEstrecha();
    renderizar();
    const encabezado = document.querySelector('[data-slot="page-header"]');

    fireEvent.click(screen.getByRole("button", { name: "Asistente" }));

    expect(screen.getByRole("dialog", { name: "Asistente de finanzas" })).toBeTruthy();
    expect(within(encabezado as HTMLElement).getByRole("button", { name: "Asistente" })).toBeTruthy();
  });

  it("las pestañas viven en una barra fija con scroll horizontal propio y la activa se hace visible", () => {
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
    try {
      renderizar("/finanzas/gastos");

      const lista = screen.getByRole("tablist", { name: "Secciones de finanzas" });
      expect(lista.className).toContain("overflow-x-auto");
      expect(lista.className).toContain("shrink-0");
      expect(lista.closest('[data-slot="page-tabs"]')?.className).toContain("shrink-0");
      expect(scrollIntoView).toHaveBeenCalledWith({ block: "nearest", inline: "nearest" });
    } finally {
      Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
    }
  });
});

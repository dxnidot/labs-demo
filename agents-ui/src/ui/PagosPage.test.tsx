// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";
import type { EventoCalendario } from "../domain/EventoCalendario";
import type { Tarjeta } from "../domain/Tarjeta";
import { AppShell } from "./AppShell";
import viteConfig from "../../vite.config";

const finanzasFake = vi.hoisted(() => ({
  listarTarjetas: vi.fn(),
  consultarCalendario: vi.fn(),
  actualizarTarjeta: vi.fn(),
}));

const usuario = {
  id: "usuario-prueba",
  username: "usuario",
  roles: [],
  chatApiRoles: [],
};

vi.mock("../infrastructure/adapters/HttpFinanzasAdapter", () => ({
  HttpFinanzasAdapter: class {
    listarTarjetas = finanzasFake.listarTarjetas;
    consultarCalendario = finanzasFake.consultarCalendario;
    actualizarTarjeta = finanzasFake.actualizarTarjeta;
  },
}));

vi.mock("../infrastructure/adapters/KeycloakAuthAdapter", () => ({
  keycloakAuthAdapter: {
    init: vi.fn(async () => usuario),
    updateToken: vi.fn(async () => "token-de-prueba"),
    logout: vi.fn(async () => {}),
  },
}));

vi.mock("../infrastructure/adapters/AdkAgenteAdapter", () => ({
  AdkAgenteAdapter: class {
    listarSesiones = vi.fn(async () => []);
  },
}));

const tarjetaActiva: Tarjeta = {
  id: "tarjeta-prueba",
  alias: "Tarjeta de prueba",
  ultimos4: "0042",
  diaCorte: 12,
  diaPago: 25,
  permiteLiquidarMsiAnticipado: true,
  activa: true,
};

const tarjetaSecundaria: Tarjeta = {
  id: "tarjeta-secundaria",
  alias: "Segunda tarjeta de prueba",
  ultimos4: "9876",
  diaCorte: 8,
  diaPago: 20,
  permiteLiquidarMsiAnticipado: false,
  activa: false,
};

const eventos: EventoCalendario[] = [
  { fecha: "2030-10-03", tipo: "CORTE", alias: "Tarjeta de prueba" },
  { fecha: "2030-10-03", tipo: "PAGO", alias: "Otra tarjeta de prueba" },
  { fecha: "2030-10-06", tipo: "PAGO", alias: "Tercera tarjeta de prueba" },
];

beforeEach(() => {
  finanzasFake.listarTarjetas
    .mockReset()
    .mockResolvedValue([tarjetaActiva, tarjetaSecundaria]);
  finanzasFake.consultarCalendario.mockReset().mockResolvedValue(eventos);
  finanzasFake.actualizarTarjeta
    .mockReset()
    .mockImplementation(async (tarjeta: Tarjeta) => tarjeta);

  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("[]", { status: 200 })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ruta /finanzas/pagos", () => {
  it("agrupa eventos por fecha, los presenta en es-MX y muestra los campos de tarjeta", async () => {
    render(
      <MemoryRouter initialEntries={["/finanzas/pagos"]}>
        <AppShell />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Pagos", level: 1 })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Pagos" }).getAttribute("aria-current")).toBe(
      "page",
    );
    expect(
      await screen.findByRole("heading", {
        name: "jueves, 3 de octubre de 2030",
        level: 3,
      }),
    ).toBeTruthy();

    const grupoDelTres = screen
      .getByRole("heading", { name: "jueves, 3 de octubre de 2030" })
      .closest("li");
    expect(grupoDelTres).not.toBeNull();
    expect(within(grupoDelTres as HTMLElement).getAllByRole("listitem")).toHaveLength(2);
    expect(within(grupoDelTres as HTMLElement).getByText("Corte")).toBeTruthy();
    expect(within(grupoDelTres as HTMLElement).getByText("Pago")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "domingo, 6 de octubre de 2030" })).toBeTruthy();

    const encabezadoTarjeta = await screen.findByRole("heading", {
      name: "Tarjeta de prueba",
      level: 3,
    });
    const tarjeta = encabezadoTarjeta.closest("article");
    expect(tarjeta).not.toBeNull();
    const contenidoTarjeta = within(tarjeta as HTMLElement);
    expect(contenidoTarjeta.getByText("•••• 0042")).toBeTruthy();
    expect(contenidoTarjeta.getByText("Corte").nextElementSibling?.textContent).toBe("Día 12");
    expect(contenidoTarjeta.getByText("Pago").nextElementSibling?.textContent).toBe("Día 25");
    expect(contenidoTarjeta.getByText("Permitido")).toBeTruthy();
    expect(contenidoTarjeta.getByText("Activa")).toBeTruthy();
    expect(
      contenidoTarjeta.getByRole("button", { name: "Desactivar Tarjeta de prueba" }),
    ).toBeTruthy();
    expect(contenidoTarjeta.getAllByRole("button")).toHaveLength(1);

    const contenidoTarjetaSecundaria = within(
      screen.getByRole("heading", { name: "Segunda tarjeta de prueba" }).closest("article") as HTMLElement,
    );
    expect(contenidoTarjetaSecundaria.getByText("•••• 9876")).toBeTruthy();
    expect(contenidoTarjetaSecundaria.getByText("No permitido")).toBeTruthy();
    expect(contenidoTarjetaSecundaria.getByText("Inactiva")).toBeTruthy();
    expect(
      contenidoTarjetaSecundaria.getByRole("button", {
        name: "Activar Segunda tarjeta de prueba",
      }),
    ).toBeTruthy();

    expect(finanzasFake.consultarCalendario).toHaveBeenCalledWith(
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      30,
    );
  });

  it("desactiva la tarjeta usando el adaptador y refleja el estado devuelto", async () => {
    const tarjetaInactiva = { ...tarjetaActiva, activa: false };
    finanzasFake.listarTarjetas
      .mockReset()
      .mockResolvedValueOnce([tarjetaActiva])
      .mockResolvedValue([tarjetaInactiva, tarjetaSecundaria]);
    finanzasFake.actualizarTarjeta.mockReset().mockImplementation(async (tarjeta: Tarjeta) => ({
      ...tarjeta,
      activa: false,
    }));

    render(
      <MemoryRouter initialEntries={["/finanzas/pagos"]}>
        <AppShell />
      </MemoryRouter>,
    );

    const desactivar = await screen.findByRole("button", {
      name: "Desactivar Tarjeta de prueba",
    });
    fireEvent.click(desactivar);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Activar Tarjeta de prueba" })).toBeTruthy();
      const tarjeta = screen
        .getByRole("heading", { name: "Tarjeta de prueba" })
        .closest("article") as HTMLElement;
      expect(within(tarjeta).getByText("Inactiva")).toBeTruthy();
    });
    expect(finanzasFake.actualizarTarjeta).toHaveBeenCalledWith({
      ...tarjetaActiva,
      activa: false,
    });
  });

  it("activa una tarjeta inactiva usando el adaptador y refleja el estado devuelto", async () => {
    const tarjetaInactiva = { ...tarjetaActiva, activa: false };
    finanzasFake.listarTarjetas
      .mockReset()
      .mockResolvedValueOnce([tarjetaInactiva])
      .mockResolvedValue([tarjetaActiva]);
    finanzasFake.actualizarTarjeta
      .mockReset()
      .mockImplementation(async (tarjeta: Tarjeta) => ({ ...tarjeta, activa: true }));

    render(
      <MemoryRouter initialEntries={["/finanzas/pagos"]}>
        <AppShell />
      </MemoryRouter>,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Activar Tarjeta de prueba" }),
    );

    await waitFor(() => {
      const tarjeta = screen
        .getByRole("heading", { name: "Tarjeta de prueba" })
        .closest("article") as HTMLElement;
      expect(within(tarjeta).getByText("Activa")).toBeTruthy();
      expect(within(tarjeta).getByRole("button", { name: "Desactivar Tarjeta de prueba" })).toBeTruthy();
    });
    expect(finanzasFake.actualizarTarjeta).toHaveBeenCalledWith(tarjetaActiva);
  });

  it("muestra el texto literal indicado cuando no hay tarjetas", async () => {
    finanzasFake.listarTarjetas.mockResolvedValue([]);
    finanzasFake.consultarCalendario.mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={["/finanzas/pagos"]}>
        <AppShell />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(
        "Aún no tienes tarjetas. Cárgalas desde el chat de Finanzas.",
        { exact: true },
      ),
    ).toBeTruthy();
    expect(
      screen.getByText("No hay cortes ni pagos programados en los próximos 30 días."),
    ).toBeTruthy();
  });
});

describe("proxy de finanzas", () => {
  it("dirige /api/finanzas a 127.0.0.1:8083 antes del proxy general /api", () => {
    const proxy = viteConfig.server?.proxy as
      | Record<string, { target?: string }>
      | undefined;
    const rutasProxy = Object.keys(proxy ?? {});

    expect(proxy?.["/api/finanzas"]?.target).toBe("http://127.0.0.1:8083");
    expect(rutasProxy.indexOf("/api/finanzas")).toBeGreaterThanOrEqual(0);
    expect(rutasProxy.indexOf("/api/finanzas")).toBeLessThan(rutasProxy.indexOf("/api"));
  });
});

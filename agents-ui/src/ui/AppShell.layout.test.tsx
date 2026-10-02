// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";
import type { Usuario } from "../domain/Usuario";
import { AppShell } from "./AppShell";

const usuario: Usuario = {
  id: "usuario-1",
  username: "ana",
  roles: ["offline_access", "ver_agentes", "ver_identidad", "usar_finanzas"],
  chatApiRoles: ["ver-menu"],
};

const auth = vi.hoisted(() => ({
  init: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  claimsToken: vi.fn(),
  updateToken: vi.fn(),
}));

vi.mock("../infrastructure/adapters/KeycloakAuthAdapter", () => ({
  keycloakAuthAdapter: auth,
}));

beforeEach(() => {
  auth.init.mockResolvedValue(usuario);
  auth.claimsToken.mockReturnValue({ preferred_username: "ana" });
  auth.updateToken.mockResolvedValue("token-prueba");
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("[]", { status: 200 })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function montar(ruta: string) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AppShell />
    </MemoryRouter>,
  );
}

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

const rutas = [
  { ruta: "/estado", titulo: "Estado del lab" },
  { ruta: "/agentes", titulo: "Agentes" },
  { ruta: "/base-de-datos", titulo: "Base de datos" },
  { ruta: "/memoria", titulo: "Memoria vectorizada" },
  { ruta: "/herramientas", titulo: "Herramientas MCP" },
  { ruta: "/menu-por-rol", titulo: "Menú por rol" },
  { ruta: "/usuarios", titulo: "Usuarios y roles" },
  { ruta: "/sincronizacion-bpm", titulo: "Sincronización BPM" },
  { ruta: "/gastos-fijos", titulo: "Gastos fijos" },
  { ruta: "/finanzas/resumen", titulo: "Finanzas" },
  { ruta: "/finanzas/gastos", titulo: "Finanzas" },
  { ruta: "/finanzas/ingresos", titulo: "Finanzas" },
  { ruta: "/finanzas/tarjetas", titulo: "Finanzas" },
  { ruta: "/finanzas/trading-mx", titulo: "Finanzas" },
  { ruta: "/finanzas/trading-usa", titulo: "Finanzas" },
];

function contenedoresConScroll(raiz: HTMLElement) {
  return Array.from(raiz.querySelectorAll('[data-slot="page-content"]'));
}

describe("estructura PageLayout por ruta", () => {
  it.each(rutas)(
    "$ruta monta su vista dentro de PageLayout con encabezado fijo y un solo scroll",
    async (vista) => {
      montar(vista.ruta);

      await screen.findByRole("heading", { name: vista.titulo, level: 1 });
      const principal = screen.getByRole("main");
      expect(principal.querySelector('[data-slot="page-header"]')?.className).toContain(
        "shrink-0",
      );
      const contenidos = contenedoresConScroll(principal);
      expect(contenidos).toHaveLength(vista.ruta.startsWith("/finanzas") ? 2 : 1);
      for (const contenido of contenidos) {
        expect(contenido.className).toContain("overflow-y-auto");
        expect(contenido.className).toContain("min-h-0");
      }
    },
  );

  it("el chat usa PageLayout con la conversación como único scroll", async () => {
    montar("/chat");

    await screen.findByRole("heading", { name: /Hola, ana/ });
    const principal = screen.getByRole("main");
    const [contenido] = contenedoresConScroll(principal);
    expect(contenedoresConScroll(principal)).toHaveLength(1);
    expect(contenido?.getAttribute("role")).toBe("log");
    expect(contenido?.className).toContain("overflow-y-auto");
  });

  it("el panel del asistente fija cabecera y composer y deja el hilo como único scroll", async () => {
    montar("/finanzas/resumen");

    const panel = await screen.findByRole("complementary", { name: "Asistente de finanzas" });
    expect(panel.querySelector('[data-slot="page-header"]')?.className).toContain("shrink-0");
    expect(panel.querySelector('[data-slot="page-footer"]')?.className).toContain("shrink-0");
    const hilo = within(panel).getByRole("log");
    expect(hilo.className).toContain("overflow-y-auto");
    expect(contenedoresConScroll(panel)).toEqual([hilo]);
  });
});

describe("landmarks de la barra lateral", () => {
  it("el aside es hermano de main y la navegación principal está en un nav etiquetado", async () => {
    montar("/estado");

    const lateral = await screen.findByRole("complementary", { name: "Barra lateral" });
    const principal = screen.getByRole("main");
    expect(lateral.contains(principal)).toBe(false);
    expect(principal.contains(lateral)).toBe(false);
    const nav = within(lateral).getByRole("navigation", { name: "Principal" });
    for (const enlace of ["Estado del lab", "Agentes", "Menú por rol", "Finanzas"]) {
      expect(within(nav).getByRole("link", { name: enlace })).toBeTruthy();
    }
    expect(within(lateral).queryAllByRole("region")).toHaveLength(0);
  });
});

describe("contraer barra lateral", () => {
  it("usa aria-expanded en ambos botones y pasa el foco al contrario", async () => {
    montar("/estado");

    const contraer = await screen.findByRole("button", { name: "Contraer barra lateral" });
    expect(contraer.getAttribute("aria-expanded")).toBe("true");
    contraer.focus();
    fireEvent.click(contraer);

    const mostrar = screen.getByRole("button", { name: "Mostrar barra lateral" });
    expect(mostrar.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(mostrar);

    fireEvent.click(mostrar);

    const contraerDeNuevo = screen.getByRole("button", { name: "Contraer barra lateral" });
    expect(contraerDeNuevo.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(contraerDeNuevo);
  });
});

describe("navegación como drawer bajo 980px", () => {
  it("muestra el botón ☰ y mantiene la barra cerrada", async () => {
    simularVistaEstrecha();
    montar("/estado");

    const abrir = await screen.findByRole("button", { name: "Abrir navegación" });
    expect(abrir.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("link", { name: "Agentes" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Contraer barra lateral" })).toBeNull();
  });

  it("abre como diálogo modal con el foco dentro", async () => {
    simularVistaEstrecha();
    montar("/estado");

    const abrir = await screen.findByRole("button", { name: "Abrir navegación" });
    fireEvent.click(abrir);

    const dialogo = screen.getByRole("dialog", { name: "Navegación" });
    expect(dialogo.getAttribute("aria-modal")).toBe("true");
    expect(abrir.getAttribute("aria-expanded")).toBe("true");
    expect(dialogo.contains(document.activeElement)).toBe(true);
    expect(within(dialogo).getByRole("link", { name: "Agentes" })).toBeTruthy();
    expect(screen.getByTestId("fondo-navegacion")).toBeTruthy();
  });

  it("Escape lo cierra y devuelve el foco al botón ☰", async () => {
    simularVistaEstrecha();
    montar("/estado");
    const abrir = await screen.findByRole("button", { name: "Abrir navegación" });
    fireEvent.click(abrir);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(abrir.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(abrir);
  });

  it("el clic en el fondo lo cierra y devuelve el foco", async () => {
    simularVistaEstrecha();
    montar("/estado");
    const abrir = await screen.findByRole("button", { name: "Abrir navegación" });
    fireEvent.click(abrir);

    fireEvent.click(screen.getByTestId("fondo-navegacion"));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(abrir);
  });

  it("Cerrar navegación lo cierra", async () => {
    simularVistaEstrecha();
    montar("/estado");
    fireEvent.click(await screen.findByRole("button", { name: "Abrir navegación" }));

    fireEvent.click(screen.getByRole("button", { name: "Cerrar navegación" }));

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("atrapa el foco con Tab y Shift+Tab", async () => {
    simularVistaEstrecha();
    montar("/estado");
    fireEvent.click(await screen.findByRole("button", { name: "Abrir navegación" }));
    const dialogo = screen.getByRole("dialog", { name: "Navegación" });
    const controles = Array.from(dialogo.querySelectorAll<HTMLElement>("a[href], button"));
    const primero = controles[0] as HTMLElement;
    const ultimo = controles.at(-1) as HTMLElement;

    ultimo.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(primero);

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(ultimo);
  });

  it("se cierra al navegar a otra ruta", async () => {
    simularVistaEstrecha();
    montar("/estado");
    fireEvent.click(await screen.findByRole("button", { name: "Abrir navegación" }));

    fireEvent.click(within(screen.getByRole("dialog")).getByRole("link", { name: "Agentes" }));

    expect(await screen.findByRole("heading", { name: "Agentes", level: 1 })).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Abrir navegación" }).getAttribute("aria-expanded"),
    ).toBe("false");
  });

  it("Nuevo chat también cierra el drawer aunque ya estés en /chat", async () => {
    simularVistaEstrecha();
    montar("/chat");
    fireEvent.click(await screen.findByRole("button", { name: "Abrir navegación" }));

    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Nuevo chat" }));

    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

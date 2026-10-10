// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";
import type { MenuOpcion } from "../domain/MenuOpcion";
import type { Usuario } from "../domain/Usuario";
import { AppShell } from "./AppShell";

const usuario: Usuario = {
  id: "usuario-1",
  username: "ana",
  roles: [
    "offline_access",
    "uma_authorization",
    "default-roles-lab",
    "ver_agentes",
    "ver_identidad",
    "usar_finanzas",
  ],
  chatApiRoles: ["ver-menu"],
};
const usuarioSinRolesPrivilegiados: Usuario = {
  id: "usuario-2",
  username: "beto",
  roles: ["offline_access", "uma_authorization", "default-roles-lab"],
  chatApiRoles: [],
};
const menu: MenuOpcion[] = [
  { clave: "reportes", titulo: "Reportes", ruta: "/reportes", acciones: ["consultar", "exportar"] },
];
const claims = {
  iss: "http://localhost:8080/realms/lab",
  azp: "agents-ui",
  preferred_username: "ana",
};
const tokenCrudo = "token-crudo-secreto";

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
  auth.login.mockResolvedValue(undefined);
  auth.logout.mockResolvedValue(undefined);
  auth.claimsToken.mockReturnValue(claims);
  auth.updateToken.mockResolvedValue(tokenCrudo);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

function montar(ruta: string) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AppShell />
    </MemoryRouter>,
  );
}

const vistas = [
  { ruta: "/estado", enlace: "Estado del lab", titulo: "Estado del lab" },
  { ruta: "/agentes", enlace: "Agentes", titulo: "Agentes" },
  { ruta: "/base-de-datos", enlace: "Base de datos", titulo: "Base de datos" },
  { ruta: "/memoria", enlace: "Memoria vectorizada", titulo: "Memoria vectorizada" },
  { ruta: "/herramientas", enlace: "Herramientas MCP", titulo: "Herramientas MCP" },
  { ruta: "/menu-por-rol", enlace: "Menú por rol", titulo: "Menú por rol" },
  { ruta: "/usuarios", enlace: "Usuarios y roles", titulo: "Usuarios y roles" },
  { ruta: "/sincronizacion-bpm", enlace: "Sincronización BPM", titulo: "Sincronización BPM" },
  { ruta: "/gastos-fijos", enlace: "Gastos fijos", titulo: "Gastos fijos" },
];

describe("login", () => {
  it("sin sesión muestra el login y el botón llama a login()", async () => {
    auth.init.mockResolvedValue(null);
    prepararFetch();

    montar("/chat");

    const boton = await screen.findByRole("button", { name: "Continuar con Keycloak" });
    await waitFor(() => expect((boton as HTMLButtonElement).disabled).toBe(false));
    expect(screen.getByRole("heading", { name: "Inicia sesión" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Agentes" })).toBeNull();
    expect(screen.queryByLabelText(/contraseña/i)).toBeNull();

    fireEvent.click(boton);

    expect(auth.login).toHaveBeenCalledTimes(1);
  });

  it("si Keycloak no responde muestra el login con un mensaje accesible", async () => {
    auth.init.mockRejectedValue(new Error("sin red"));
    prepararFetch();

    montar("/chat");

    const alerta = await screen.findByRole("alert");
    expect(alerta.textContent).toContain("Keycloak");
    expect(screen.getByRole("button", { name: "Continuar con Keycloak" })).toBeTruthy();
  });

  it("con sesión muestra el shell y cerrar sesión llama a logout", async () => {
    prepararFetch();

    montar("/chat");

    expect(await screen.findByRole("heading", { name: "Hola, ana. ¿En qué te ayudo?" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Continuar con Keycloak" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));

    expect(auth.logout).toHaveBeenCalledTimes(1);
  });
});

describe("sidebar y rutas", () => {
  it.each(["/", "/ruta-desconocida"])("redirige %s a /chat", async (ruta) => {
    prepararFetch();

    montar(ruta);

    expect(await screen.findByRole("heading", { name: /Hola, ana/ })).toBeTruthy();
  });

  it.each(vistas)("la entrada $enlace abre su vista y marca aria-current", async (vista) => {
    prepararFetch();

    montar("/chat");
    fireEvent.click(await screen.findByRole("link", { name: vista.enlace }));

    expect(await screen.findByRole("heading", { name: vista.titulo, level: 1 })).toBeTruthy();
    expect(screen.getByRole("link", { name: vista.enlace }).getAttribute("aria-current")).toBe("page");
  });

  it("no ofrece MENÚ, Buscar chats, Configuración ni la entrada Chat suelta", async () => {
    prepararFetch([], menu);

    montar("/chat");
    await screen.findByRole("heading", { name: /Hola, ana/ });

    expect(screen.queryByText("MENÚ")).toBeNull();
    expect(screen.queryByText("Buscar chats")).toBeNull();
    expect(screen.queryByLabelText("Configuración")).toBeNull();
    expect(screen.queryByRole("link", { name: "Chat" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Reportes" })).toBeNull();
    for (const titulo of ["AGENTES", "IDENTIDAD", "PERSONAL · SOLO LOCAL", "RECIENTES"]) {
      expect(screen.getByText(titulo)).toBeTruthy();
    }
    expect(screen.getByText("ver-menu · LOCAL")).toBeTruthy();
  });

  it("contrae y vuelve a mostrar la barra lateral", async () => {
    prepararFetch();

    montar("/chat");
    fireEvent.click(await screen.findByRole("button", { name: "Contraer barra lateral" }));

    expect(screen.queryByRole("link", { name: "Agentes" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Mostrar barra lateral" }));

    expect(screen.getByRole("link", { name: "Agentes" })).toBeTruthy();
  });

  it("Nuevo chat lleva a /chat desde otra vista", async () => {
    prepararFetch();

    montar("/agentes");
    fireEvent.click(await screen.findByRole("button", { name: "Nuevo chat" }));

    expect(await screen.findByRole("heading", { name: /Hola, ana/ })).toBeTruthy();
  });

  it.each(["/finanzas", "/finanzas/inexistente"])(
    "redirige %s a /finanzas/resumen y marca activa Finanzas",
    async (ruta) => {
      prepararFetch();

      montar(ruta);

      expect(await screen.findByRole("heading", { name: "Finanzas" })).toBeTruthy();
      expect(screen.getByRole("tab", { name: "Resumen" }).getAttribute("aria-selected")).toBe("true");
      expect(screen.getByRole("link", { name: "Finanzas" }).getAttribute("aria-current")).toBe("page");
    },
  );

  it("redirige /finanzas/pagos a /finanzas/tarjetas y no ofrece la entrada Pagos", async () => {
    prepararFetch();

    montar("/finanzas/pagos");

    expect(
      (await screen.findByRole("tab", { name: "Tarjetas y pagos" })).getAttribute("aria-selected"),
    ).toBe("true");
    expect(screen.queryByRole("link", { name: "Pagos" })).toBeNull();
    expect(screen.getByRole("link", { name: "Finanzas" }).getAttribute("aria-current")).toBe("page");
  });

  it("mantiene Finanzas activa en cualquier /finanzas/* y navega entre pestañas", async () => {
    prepararFetch();

    montar("/finanzas/gastos");

    expect((await screen.findByRole("tab", { name: "Gastos" })).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("link", { name: "Finanzas" }).getAttribute("aria-current")).toBe("page");

    fireEvent.click(screen.getByRole("tab", { name: "Trading MX" }));

    expect(screen.getByRole("tab", { name: "Trading MX" }).getAttribute("aria-selected")).toBe("true");
  });

  it("sin ver_agentes, ver_identidad ni usar_finanzas no renderiza esas secciones en el DOM", async () => {
    auth.init.mockResolvedValue(usuarioSinRolesPrivilegiados);
    prepararFetch();

    montar("/chat");

    expect(await screen.findByRole("heading", { name: /Hola, beto/ })).toBeTruthy();
    expect(screen.getByText("Estado del lab")).toBeTruthy();
    for (const titulo of ["AGENTES", "IDENTIDAD", "PERSONAL · SOLO LOCAL"]) {
      expect(screen.queryByText(titulo)).toBeNull();
    }
    for (const enlace of [
      "Agentes",
      "Base de datos",
      "Memoria vectorizada",
      "Herramientas MCP",
      "Menú por rol",
      "Usuarios y roles",
      "Sincronización BPM",
      "Finanzas",
      "Gastos fijos",
    ]) {
      expect(screen.queryByRole("link", { name: enlace })).toBeNull();
    }
  });

  it.each(["/agentes", "/finanzas/resumen", "/usuarios"])(
    "sin el rol requerido, entrar por URL a %s muestra Acceso denegado en vez de la vista",
    async (ruta) => {
      auth.init.mockResolvedValue(usuarioSinRolesPrivilegiados);
      prepararFetch();

      montar(ruta);

      expect(await screen.findByText("No tienes permiso para ver esta sección.")).toBeTruthy();
      expect(screen.queryByRole("heading", { name: "Agentes" })).toBeNull();
      expect(screen.queryByRole("heading", { name: "Finanzas" })).toBeNull();
      expect(screen.queryByRole("heading", { name: "Usuarios y roles" })).toBeNull();
    },
  );

  it("Recientes no lista las sesiones creadas desde el panel de finanzas", async () => {
    prepararFetch([
      { id: "s1", lastUpdateTime: 2, state: { titulo: "Conversación normal" } },
      { id: "s2", lastUpdateTime: 3, state: { titulo: "Gasto del panel", origen: "finanzas" } },
    ]);

    montar("/chat");

    const historial = await screen.findByRole("navigation", { name: "Historial de chats" });
    expect(await within(historial).findByText("Conversación normal")).toBeTruthy();
    expect(within(historial).queryByText("Gasto del panel")).toBeNull();
  });
});

describe("pantallas con datos", () => {
  it("estados vacíos con el texto exacto de la regla", async () => {
    prepararFetch();

    montar("/memoria");

    expect(
      await screen.findByText("Sin datos todavía · Fuente: memory service / RAG · Pendiente: EXT-01"),
    ).toBeTruthy();
  });

  it("Estado del lab muestra un servicio arriba y otro sin respuesta", async () => {
    prepararFetch();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url === "/salud/keycloak") {
          return new Response("{}", { status: 200 });
        }
        if (url.endsWith("/sessions")) {
          return new Response("[]", { status: 200 });
        }
        throw new Error("sin conexión");
      }),
    );

    montar("/estado");

    const tarjetaKeycloak = (await screen.findByText("Keycloak", { selector: "span" })).closest("section");
    await waitFor(() => expect(within(tarjetaKeycloak as HTMLElement).getByText("Arriba")).toBeTruthy());
    const tarjetaFinanzas = screen.getByText("finanzas", { selector: "span" }).closest("section");
    expect(within(tarjetaFinanzas as HTMLElement).getByText("Sin respuesta")).toBeTruthy();
    expect(screen.queryByText("kc-front")).toBeNull();
    expect(
      screen.getByText("Sin datos todavía · Fuente: health check de Java A2A · Pendiente: AG-02"),
    ).toBeTruthy();
  });

  it("Base de datos lista las sesiones del usuario y deja vacías las demás tablas", async () => {
    prepararFetch([
      {
        id: "3f9c0000000000000000a21e",
        lastUpdateTime: 1_790_000_000,
        state: { titulo: "Gastos de septiembre" },
      },
    ]);

    montar("/base-de-datos");

    const panel = await screen.findByRole("tabpanel");
    expect(await within(panel).findByText("Gastos de septiembre")).toBeTruthy();
    expect(within(panel).getByText("3f9c…a21e")).toBeTruthy();
    expect(screen.getByText("Solo lectura")).toBeTruthy();
    expect(screen.queryByText(/SELECT/)).toBeNull();

    fireEvent.click(screen.getByRole("tab", { name: "events" }));

    expect(
      screen.getByText("Sin datos todavía · Fuente: ADK API server · tabla events · Pendiente: AG-05"),
    ).toBeTruthy();
  });

  it("Menú por rol muestra las opciones de /api/menu del usuario actual", async () => {
    const fetchMock = prepararFetch([], menu);

    montar("/menu-por-rol");

    expect(await screen.findByText("Reportes")).toBeTruthy();
    expect(screen.getByText("consultar")).toBeTruthy();
    expect(screen.getByText("exportar")).toBeTruthy();
    expect(screen.getByText("roles: ver-menu")).toBeTruthy();
    expect(screen.getByText("La acción también se valida en el backend.")).toBeTruthy();
    expect(fetchMock.mock.calls.filter(([url]) => url === "/api/menu")).toHaveLength(1);
  });

  it("Usuarios y roles muestra los claims sin el token crudo", async () => {
    prepararFetch();

    const { container } = montar("/usuarios");

    expect(await screen.findByText(/"azp": "agents-ui"/)).toBeTruthy();
    expect(screen.getByText(/"preferred_username": "ana"/)).toBeTruthy();
    expect(container.textContent).not.toContain(tokenCrudo);
  });
});

function prepararFetch(sesiones: unknown[] = [], opcionesMenu: MenuOpcion[] = []) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url === "/api/menu") {
      return new Response(JSON.stringify(opcionesMenu), { status: 200 });
    }
    if (url.endsWith("/sessions")) {
      return new Response(JSON.stringify(sesiones), { status: 200 });
    }
    return new Response("[]", { status: 200 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

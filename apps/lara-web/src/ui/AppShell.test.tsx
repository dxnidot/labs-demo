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
    "ver-finanzas",
  ],
  kcMenuRoles: ["ver-menu"],
};
const usuarioSinRolesPrivilegiados: Usuario = {
  id: "usuario-2",
  username: "beto",
  roles: ["offline_access", "uma_authorization", "default-roles-lab"],
  kcMenuRoles: [],
};
const menu: MenuOpcion[] = [
  { clave: "reportes", titulo: "Reportes", ruta: "/reportes", acciones: ["consultar", "exportar"] },
];
const claims = {
  iss: "http://localhost:8080/realms/lab",
  azp: "lara-web",
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

  it("el botón Apariencia abre el diálogo y al cerrarlo devuelve el foco al botón", async () => {
    prepararFetch();

    montar("/chat");

    const boton = await screen.findByRole("button", { name: "Apariencia" });
    fireEvent.click(boton);
    expect(screen.getByRole("dialog", { name: "Apariencia" })).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Apariencia" })).toBeNull());
    expect(document.activeElement).toBe(boton);
  });
});

describe("estados de carga y error con reintento", () => {
  it("Estado del lab muestra esqueletos con aviso mientras comprueba los servicios", async () => {
    prepararFetch();
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => {})));

    montar("/estado");

    expect(await screen.findByText("Comprobando servicios…")).toBeTruthy();
    expect(document.querySelectorAll("main .animate-pulse").length).toBeGreaterThan(0);
  });

  it("Base de datos: si falla la carga ofrece Reintentar y luego muestra las sesiones", async () => {
    let llamadas = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input).endsWith("/sessions")) {
          llamadas += 1;
          // Las dos primeras llamadas son la del historial del shell y la de la página; fallan ambas.
          return llamadas <= 2
            ? new Response("", { status: 500 })
            : new Response(
                JSON.stringify([{ id: "3f9c0000000000000000a21e", lastUpdateTime: 1_790_000_000, state: { titulo: "Sesión recuperada" } }]),
                { status: 200 },
              );
        }
        return new Response("[]", { status: 200 });
      }),
    );

    montar("/base-de-datos");

    const panel = await screen.findByRole("tabpanel");
    const alerta = await within(panel).findByRole("alert");
    expect(alerta.textContent).toBeTruthy();
    fireEvent.click(within(panel).getByRole("button", { name: "Reintentar" }));

    expect(await within(panel).findByText("Sesión recuperada")).toBeTruthy();
    expect(within(panel).queryByRole("alert")).toBeNull();
  });

  it("Menú por rol: si falla ofrece Reintentar y luego muestra las opciones", async () => {
    let llamadas = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input) === "/api/menu") {
          llamadas += 1;
          return llamadas === 1 ? new Response("", { status: 503 }) : new Response(JSON.stringify(menu), { status: 200 });
        }
        return new Response("[]", { status: 200 });
      }),
    );

    montar("/menu-por-rol");

    expect(await screen.findByRole("alert")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("Reportes")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("Recientes: si falla el historial ofrece Reintentar y lo recupera", async () => {
    let llamadas = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input).endsWith("/sessions")) {
          llamadas += 1;
          return llamadas === 1
            ? new Response("", { status: 500 })
            : new Response(JSON.stringify([{ id: "a1", lastUpdateTime: 1_790_000_000, state: { titulo: "Chat recuperado" } }]), { status: 200 });
        }
        return new Response("[]", { status: 200 });
      }),
    );

    montar("/estado");

    const nav = await screen.findByRole("navigation", { name: "Historial de chats" });
    expect(await within(nav).findByRole("alert")).toBeTruthy();
    fireEvent.click(within(nav).getByRole("button", { name: "Reintentar" }));

    expect(await within(nav).findByText("Chat recuperado")).toBeTruthy();
  });
});

describe("accesibilidad del shell", () => {
  it("el skip link es lo primero que se alcanza con Tab y manda el foco al contenido principal", async () => {
    prepararFetch();

    montar("/estado");

    const salto = await screen.findByRole("link", { name: "Saltar al contenido principal" });
    expect(salto.getAttribute("href")).toBe("#contenido-principal");
    fireEvent.click(salto);
    const principal = screen.getByRole("main");
    expect(principal.id).toBe("contenido-principal");
    expect(document.activeElement).toBe(principal);
  });

  it.each([
    ["/estado", "Estado del lab · Lara"],
    ["/agentes", "Agentes · Lara"],
    ["/finanzas/tarjetas", "Finanzas · Tarjetas y pagos · Lara"],
    ["/chat", "Chat · Lara"],
  ])("el título del documento de %s es %s", async (ruta, titulo) => {
    prepararFetch();

    montar(ruta);

    await waitFor(() => expect(document.title).toBe(titulo));
  });

  it("el login tiene su propio título", async () => {
    auth.init.mockResolvedValue(null);
    prepararFetch();

    montar("/chat");

    await screen.findByRole("button", { name: "Continuar con Keycloak" });
    expect(document.title).toBe("Iniciar sesión · Lara");
  });

  it("las pestañas de tablas de Base de datos usan tabindex itinerante, flechas y relación con su panel", async () => {
    prepararFetch();

    montar("/base-de-datos");

    const lista = await screen.findByRole("tablist", { name: "Tablas" });
    const [sessions, events] = within(lista).getAllByRole("tab");
    expect(sessions.getAttribute("tabindex")).toBe("0");
    expect(events.getAttribute("tabindex")).toBe("-1");

    sessions.focus();
    fireEvent.keyDown(sessions, { key: "ArrowRight" });

    expect(events.getAttribute("aria-selected")).toBe("true");
    expect(document.activeElement).toBe(events);
    const panel = screen.getByRole("tabpanel");
    expect(panel.getAttribute("aria-labelledby")).toBe(events.id);
    expect(events.getAttribute("aria-controls")).toBe(panel.id);
  });
});

describe("aviso de ADR-0007 junto al campo del chat", () => {
  function descripcionDe(campo: HTMLElement): string {
    const id = campo.getAttribute("aria-describedby");
    return (id && document.getElementById(id)?.textContent) || "";
  }

  it("el chat nuevo lo muestra enlazado al campo de mensaje, sin botón de cerrar y sin localStorage", async () => {
    prepararFetch();
    localStorage.clear();

    montar("/chat");

    const campo = await screen.findByRole("textbox", { name: "Mensaje para Lara" });
    expect(descripcionDe(campo)).toContain("se envía al proveedor del modelo");
    expect(screen.queryByRole("button", { name: /cerrar aviso|descartar/i })).toBeNull();
    expect(localStorage.length).toBe(0);
  });

  it("el asistente de Finanzas también lo muestra junto a su campo", async () => {
    prepararFetch();

    montar("/finanzas/resumen");

    const campo = await screen.findByRole("textbox", { name: "Mensaje para el asistente de finanzas" });
    expect(descripcionDe(campo)).toContain("No incluyas datos reales");
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

  it("sin ver_agentes, ver_identidad ni ver-finanzas no renderiza esas secciones en el DOM", async () => {
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
  it("los estados vacíos explican la carencia en lenguaje claro", async () => {
    prepararFetch();

    montar("/memoria");

    expect(
      await screen.findByText("La memoria vectorizada aún no está conectada: todavía no hay nada que buscar."),
    ).toBeTruthy();
  });

  it.each([
    "/estado",
    "/agentes",
    "/base-de-datos",
    "/memoria",
    "/herramientas",
    "/menu-por-rol",
    "/usuarios",
    "/sincronizacion-bpm",
    "/gastos-fijos",
    "/finanzas/resumen",
  ])("%s no muestra claves del backlog ni 'Pendiente:' al usuario", async (ruta) => {
    prepararFetch();

    montar(ruta);

    await screen.findByRole("heading", { level: 1 });
    await waitFor(() => expect(screen.queryByText(/^(Cargando|Comprobando)/)).toBeNull());
    const texto = document.querySelector("main")?.textContent ?? "";
    expect(texto).not.toMatch(/\b(?:AG|UI|EXT|FIN|BPM|KC|FE|QA|OBS)-\d{2}\b/);
    expect(texto).not.toMatch(/Pendiente:|Sin datos todavía/);
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
    expect(screen.getAllByText("Aún no hay comprobación de salud para este servicio.")).toHaveLength(3);
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

    expect(screen.getByText("Esta tabla aún no se puede consultar desde Lara.")).toBeTruthy();
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

    expect(await screen.findByText(/"azp": "lara-web"/)).toBeTruthy();
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

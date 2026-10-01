// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";
import type { MenuOpcion } from "../domain/MenuOpcion";
import type { Usuario } from "../domain/Usuario";
import { AppShell } from "./AppShell";

const usuario: Usuario = {
  id: "usuario-1",
  username: "ana",
  roles: ["offline_access", "uma_authorization", "default-roles-lab"],
  chatApiRoles: ["ver-menu"],
};
const menu: MenuOpcion[] = [
  {
    clave: "reportes",
    titulo: "Reportes",
    ruta: "/reportes",
    acciones: ["consultar", "exportar"],
  },
  {
    clave: "chat",
    titulo: "Ruta duplicada",
    ruta: "/CHAT/",
    acciones: ["consultar"],
  },
];

vi.mock("../infrastructure/adapters/KeycloakAuthAdapter", () => ({
  keycloakAuthAdapter: {
    init: vi.fn(async () => usuario),
    updateToken: vi.fn(async () => "test-token"),
    logout: vi.fn(async () => {}),
  },
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("AppShell routes", () => {
  it.each(["/", "/ruta-desconocida"])("redirige %s a /chat", async (path) => {
    prepararFetch([]);

    render(
      <MemoryRouter initialEntries={[path]}>
        <AppShell />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Nuevo chat" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Chat" }).getAttribute("aria-current")).toBe("page");
  });

  it("muestra las opciones del menú y abre su placeholder al cargar directamente la ruta", async () => {
    const fetchMock = prepararFetch(menu);
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});

    render(
      <MemoryRouter initialEntries={["/reportes"]}>
        <AppShell />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Reportes" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "MENÚ" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Reportes" }).getAttribute("href")).toBe("/reportes");
    expect(screen.getByText("/reportes")).toBeTruthy();
    expect(screen.getByText("consultar")).toBeTruthy();
    expect(screen.getByText("exportar")).toBeTruthy();
    expect(screen.getByText("Vista de prueba del control de acceso")).toBeTruthy();
    expect(screen.getByText("ver-menu")).toBeTruthy();
    expect(screen.queryByText("offline_access")).toBeNull();
    expect(screen.queryByText("uma_authorization")).toBeNull();
    expect(screen.queryByText("default-roles-lab")).toBeNull();
    expect(fetchMock.mock.calls.filter(([url]) => url === "/api/menu")).toHaveLength(1);
    expect(warning).toHaveBeenCalledWith(
      "Se omitió una ruta del menú que coincide con una ruta fija de Lara.",
    );
  });

  it("abre /finanzas y marca activa la pestaña Finanzas", async () => {
    prepararFetch([]);

    render(
      <MemoryRouter initialEntries={["/finanzas"]}>
        <AppShell />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Finanzas" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Finanzas" }).getAttribute("aria-current")).toBe(
      "page",
    );
  });

  it("oculta MENÚ cuando falla la API sin mostrar un error en la interfaz", async () => {
    prepararFetch([], true);
    vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <MemoryRouter initialEntries={["/chat"]}>
        <AppShell />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Nuevo chat" })).toBeTruthy();
    expect(screen.queryByRole("region", { name: "MENÚ" })).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

function prepararFetch(opciones: MenuOpcion[], menuError = false) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    if (String(input) === "/api/menu") {
      return menuError
        ? new Response("", { status: 503 })
        : new Response(JSON.stringify(opciones), { status: 200 });
    }
    return new Response("[]", { status: 200 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

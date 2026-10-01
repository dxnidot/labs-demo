// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";
import type { Usuario } from "../domain/Usuario";
import { AppShell } from "./AppShell";

const usuario: Usuario = {
  id: "usuario-1",
  username: "ana",
  roles: ["offline_access"],
  chatApiRoles: [],
};

const auth = vi.hoisted(() => ({
  init: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  claimsToken: vi.fn(),
  updateToken: vi.fn(),
}));

const compuerta = vi.hoisted(() => {
  let abrir: () => void = () => {};
  const promesa = new Promise<void>((resolver) => {
    abrir = resolver;
  });
  return { abrir: () => abrir(), promesa };
});

vi.mock("../infrastructure/adapters/KeycloakAuthAdapter", () => ({
  keycloakAuthAdapter: auth,
}));

vi.mock("./MemoriaPage", async (importarOriginal) => {
  await compuerta.promesa;
  return importarOriginal();
});

beforeEach(() => {
  auth.init.mockResolvedValue(usuario);
  auth.updateToken.mockResolvedValue("token-prueba");
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("[]", { status: 200 })),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("carga diferida de vistas", () => {
  it("una ruta diferida muestra el estado de carga accesible y luego la vista", async () => {
    render(
      <MemoryRouter initialEntries={["/memoria"]}>
        <AppShell />
      </MemoryRouter>,
    );

    const estado = await screen.findByText("Cargando vista…");
    expect(estado.getAttribute("role")).toBe("status");
    expect(screen.queryByRole("heading", { name: "Memoria vectorizada" })).toBeNull();

    compuerta.abrir();

    expect(
      await screen.findByRole("heading", { name: "Memoria vectorizada", level: 1 }),
    ).toBeTruthy();
    expect(screen.queryByText("Cargando vista…")).toBeNull();
  });
});

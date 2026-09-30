// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";
import type { Usuario } from "../domain/Usuario";
import { AppShell } from "./AppShell";

const usuario: Usuario = {
  id: "usuario-1",
  username: "ana",
  roles: ["ver-menu"],
  chatApiRoles: ["ver-menu"],
};

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
});

describe("AppShell routes", () => {
  it.each(["/", "/ruta-desconocida"])("redirige %s a /chat", async (path) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("[]", { status: 200 })),
    );

    render(
      <MemoryRouter initialEntries={[path]}>
        <AppShell />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "Nuevo chat" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Chat" }).getAttribute("aria-current")).toBe("page");
  });
});

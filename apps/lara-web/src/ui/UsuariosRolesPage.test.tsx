// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { UsuariosRealmPort } from "../application/ports/UsuariosRealmPort";
import type { UsuarioRealm } from "../domain/UsuarioRealm";

vi.mock("../infrastructure/composition", () => ({
  adaptadores: { auth: { claimsToken: () => ({ preferred_username: "demo" }) } },
}));

import { UsuariosRolesPage } from "./UsuariosRolesPage";

const usuarios: UsuarioRealm[] = [
  { username: "ejemplo-lima", grupo: "ejecutivos", roles: ["ver-menu"] },
  { username: "ejemplo-nube", grupo: "supervisores", roles: ["ver-menu", "autorizar"] },
];

function montar(listarUsuarios: UsuariosRealmPort["listarUsuarios"]) {
  return render(<UsuariosRolesPage usuariosRealm={{ listarUsuarios }} />);
}

afterEach(cleanup);

describe("UsuariosRolesPage", () => {
  it("anuncia la carga y muestra el esqueleto mientras espera", () => {
    montar(() => new Promise<UsuarioRealm[]>(() => {}));

    expect(screen.getByRole("status").textContent).toBe("Cargando usuarios del realm.");
    expect(screen.getByRole("region", { name: "Usuarios del realm" })).toBeTruthy();
  });

  it("presenta usuarios, grupo y roles, y conserva el inspector de token", async () => {
    montar(vi.fn(async () => usuarios));

    const tabla = await screen.findByRole("table");
    expect(tabla.textContent).toContain("usuario");
    expect(tabla.textContent).toContain("roles chat-api");
    expect(tabla.textContent).toContain("ejemplo-lima");
    expect(tabla.textContent).toContain("ejecutivos");
    expect(tabla.textContent).toContain("autorizar");
    expect(screen.getByRole("heading", { name: "Inspector de token" })).toBeTruthy();
    expect(screen.getByText(/"preferred_username": "demo"/)).toBeTruthy();
    expect(screen.getByText("Solo se decodifica en pantalla. El token nunca se guarda.")).toBeTruthy();
  });

  it("muestra un mensaje claro cuando no hay usuarios", async () => {
    montar(async () => []);

    expect(await screen.findByText("Aún no hay usuarios para mostrar en este realm.")).toBeTruthy();
  });

  it("permite reintentar la carga después de un error", async () => {
    const listarUsuarios = vi.fn<UsuariosRealmPort["listarUsuarios"]>()
      .mockRejectedValueOnce(new Error("fallo de ejemplo"))
      .mockResolvedValueOnce(usuarios);
    montar(listarUsuarios);

    expect(await screen.findByRole("alert")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    await waitFor(() => expect(screen.getByRole("table")).toBeTruthy());
    expect(listarUsuarios).toHaveBeenCalledTimes(2);
  });
});

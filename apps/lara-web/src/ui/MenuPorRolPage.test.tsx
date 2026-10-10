// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { MenuPorRolPort } from "../application/ports/MenuPorRolPort";
import type { Usuario } from "../domain/Usuario";
import type { UsuarioMenu } from "../domain/UsuarioMenu";

const { obtenerMenu } = vi.hoisted(() => ({ obtenerMenu: vi.fn() }));
vi.mock("../infrastructure/composition", () => ({ adaptadores: { menu: { obtenerMenu } } }));

import { MenuPorRolPage } from "./MenuPorRolPage";

const usuario: Usuario = { id: "actual", username: "usuario-real", roles: ["consulta"], kcMenuRoles: ["consulta"] };
const pruebas: UsuarioMenu[] = [
  { username: "demo-lector", roles: ["consultar"], opciones: [{ clave: "solicitudes", titulo: "Solicitudes", ruta: "/solicitudes", acciones: ["Ver", "Aprobar"] }] },
  { username: "demo-aprobador", roles: ["autorizar"], opciones: [{ clave: "solicitudes", titulo: "Solicitudes", ruta: "/solicitudes", acciones: ["Ver", "Aprobar"] }] },
];

function montar(menuPorRol: MenuPorRolPort) {
  obtenerMenu.mockResolvedValue([{ clave: "actual", titulo: "Menú real", ruta: "/real", acciones: ["Ver"] }]);
  return render(<MenuPorRolPage menuPorRol={menuPorRol} usuario={usuario} />);
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("MenuPorRolPage", () => {
  it("muestra carga de pruebas y conserva el menú real del usuario actual", async () => {
    let resolver!: (resultado: UsuarioMenu[]) => void;
    const menuPorRol: MenuPorRolPort = {
      listarPorUsuario: vi.fn(() => new Promise<UsuarioMenu[]>((resolve) => { resolver = resolve; })),
    };
    montar(menuPorRol);
    expect(
      screen.getAllByRole("status").some((nodo) => nodo.textContent?.includes("Cargando menús de usuarios de prueba")),
    ).toBe(true);
    expect(await screen.findByText("Menú real")).toBeTruthy();
    resolver(pruebas);
    expect(await screen.findByRole("region", { name: "Menú de demo-lector" })).toBeTruthy();
  });

  it("muestra tarjetas y reserva Aprobar al rol autorizar", async () => {
    montar({ listarPorUsuario: vi.fn(async () => pruebas) });
    const lector = await screen.findByRole("region", { name: "Menú de demo-lector" });
    const aprobador = await screen.findByRole("region", { name: "Menú de demo-aprobador" });
    expect(lector.textContent).not.toContain("Aprobar");
    expect(aprobador.textContent).toContain("Aprobar");
    expect(screen.getByRole("region", { name: "Menú de usuario-real" })).toBeTruthy();
  });

  it("muestra el estado vacío cuando no hay usuarios de prueba", async () => {
    montar({ listarPorUsuario: vi.fn(async () => []) });
    expect(await screen.findByText("No hay usuarios de prueba para mostrar.")).toBeTruthy();
  });

  it("permite reintentar una carga fallida", async () => {
    const listarPruebas = vi.fn<() => Promise<UsuarioMenu[]>>().mockRejectedValueOnce(new Error("Fallo de prueba")).mockResolvedValue(pruebas);
    montar({ listarPorUsuario: listarPruebas });
    expect(await screen.findByText("Fallo de prueba")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("region", { name: "Menú de demo-lector" })).toBeTruthy();
    expect(listarPruebas).toHaveBeenCalledTimes(2);
  });
});

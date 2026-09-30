// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Aclaracion } from "../domain/Aclaracion";
import type { MenuOpcion } from "../domain/MenuOpcion";
import type { ResultadoAprobacion } from "../domain/ResultadoAprobacion";
import type { Usuario } from "../domain/Usuario";
import { MenuPorRolPage } from "./MenuPorRolPage";

const usuario: Usuario = {
  id: "usuario-1",
  username: "beto",
  roles: ["ver-menu", "autorizar"],
  chatApiRoles: ["ver-menu", "autorizar"],
};

const menu: MenuOpcion[] = [
  {
    clave: "aclaraciones",
    titulo: "Aclaraciones",
    ruta: "/aclaraciones",
    acciones: ["consultar", "aprobar"],
  },
];

const aclaraciones: Aclaracion[] = [
  { id: 42, descripcion: "Solicitud devuelta por el backend", estatus: "pendiente" },
];

describe("MenuPorRolPage", () => {
  it("aprueba con el identificador devuelto por la API", async () => {
    const obtenerMenu = vi.fn(async () => menu);
    const obtenerAclaraciones = vi.fn(async () => aclaraciones);
    const aprobarAclaracion = vi.fn(
      async (id: number): Promise<ResultadoAprobacion> => ({ id, estatus: "aprobada" }),
    );

    render(
      <MenuPorRolPage
        aprobarAclaracion={aprobarAclaracion}
        obtenerAclaraciones={obtenerAclaraciones}
        obtenerMenu={obtenerMenu}
        usuario={usuario}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Aprobar" }));

    await waitFor(() => {
      expect(aprobarAclaracion).toHaveBeenCalledWith(42);
      expect(screen.getByText("#42 · aprobada")).toBeTruthy();
    });
    expect(obtenerAclaraciones).toHaveBeenCalledOnce();
  });

  it("no muestra Aprobar si el usuario no tiene el rol requerido", async () => {
    const obtenerMenu = async () => menu;
    const obtenerAclaraciones = async () => aclaraciones;
    const aprobarAclaracion = vi.fn(
      async (id: number): Promise<ResultadoAprobacion> => ({ id, estatus: "aprobada" }),
    );

    render(
      <MenuPorRolPage
        aprobarAclaracion={aprobarAclaracion}
        obtenerAclaraciones={obtenerAclaraciones}
        obtenerMenu={obtenerMenu}
        usuario={{ ...usuario, chatApiRoles: ["ver-menu"] }}
      />,
    );

    await screen.findByText("Solicitud devuelta por el backend");
    expect(screen.queryByRole("button", { name: "Aprobar" })).toBeNull();
    expect(aprobarAclaracion).not.toHaveBeenCalled();
  });
});

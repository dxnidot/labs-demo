// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { MenuOpcion } from "../domain/MenuOpcion";
import { MenuPorRolPage } from "./MenuPorRolPage";

const menu: MenuOpcion[] = [
  {
    clave: "reportes",
    titulo: "Reportes",
    ruta: "/reportes",
    acciones: ["consultar", "exportar"],
  },
  {
    clave: "usuarios",
    titulo: "Usuarios",
    ruta: "/usuarios",
    acciones: ["consultar"],
  },
];

describe("MenuPorRolPage", () => {
  it("muestra las opciones y acciones devueltas por la API como etiquetas de solo lectura", async () => {
    const obtenerMenu = vi.fn(async () => menu);

    render(
      <MenuPorRolPage
        obtenerMenu={obtenerMenu}
      />,
    );

    expect(await screen.findByRole("heading", { name: "Reportes" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Usuarios" })).toBeTruthy();
    expect(screen.getByText("/reportes")).toBeTruthy();
    expect(screen.getAllByText("consultar")).toHaveLength(2);
    expect(screen.getByText("exportar")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
    expect(obtenerMenu).toHaveBeenCalledOnce();
  });
});

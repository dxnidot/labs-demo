// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { BaseDatosPort } from "../application/ports/BaseDatosPort";
import type { ConsultaTablaAdk, NombreTablaAdk } from "../domain/TablaAdk";
import type { Usuario } from "../domain/Usuario";
import { BaseDeDatosPage } from "./BaseDeDatosPage";

vi.mock("../infrastructure/composition", () => ({
  adaptadores: { agente: { listarSesiones: vi.fn(async () => []) } },
}));

const usuario: Usuario = { id: "usuario-demo", username: "persona-demo", roles: ["admin"], kcMenuRoles: [] };
const resultado = (tabla: NombreTablaAdk): ConsultaTablaAdk => ({
  tabla,
  sql: `SELECT id FROM ${tabla} LIMIT 20;`,
  columnas: ["id"],
  filas: [[`fila-${tabla}`]],
});
const diferir = <T,>() => {
  let resolver!: (valor: T) => void;
  const promesa = new Promise<T>((resolverPromesa) => { resolver = resolverPromesa; });
  return { promesa, resolver };
};

function montar(baseDatos: BaseDatosPort) {
  return render(<BaseDeDatosPage baseDatos={baseDatos} usuario={usuario} />);
}

afterEach(cleanup);

describe("BaseDeDatosPage · tablas ADK", () => {
  for (const tabla of ["events", "app_states", "user_states"] as const) {
    it(`consulta ${tabla} y muestra SQL y filas`, async () => {
      const consultarTabla = vi.fn(async (actual: NombreTablaAdk) => resultado(actual));
      montar({ consultarTabla });
      fireEvent.click(screen.getByRole("tab", { name: tabla }));
      expect((await screen.findByLabelText("Consulta SQL")).textContent).toContain(`SELECT id FROM ${tabla}`);
      expect(screen.getByRole("table").textContent).toContain(`fila-${tabla}`);
      expect(consultarTabla).toHaveBeenCalledWith(tabla);
    });

    it(`muestra carga para ${tabla}`, async () => {
      const pendiente = diferir<ConsultaTablaAdk>();
      const consultarTabla = vi.fn(() => pendiente.promesa);
      montar({ consultarTabla });
      fireEvent.click(screen.getByRole("tab", { name: tabla }));
      expect((await screen.findByRole("status")).textContent).toContain(`Cargando ${tabla}`);
      pendiente.resolver(resultado(tabla));
    });

    it(`muestra estado vacío para ${tabla}`, async () => {
      const consultarTabla = vi.fn(async (actual: NombreTablaAdk) => ({ ...resultado(actual), filas: [] }));
      montar({ consultarTabla });
      fireEvent.click(screen.getByRole("tab", { name: tabla }));
      expect(await screen.findByText("Esta tabla todavía no tiene registros guardados.")).toBeTruthy();
      expect(screen.getByLabelText("Consulta SQL")).toBeTruthy();
    });

    it(`permite reintentar ${tabla} tras un error`, async () => {
      const consultarTabla = vi.fn().mockRejectedValueOnce(new Error("No se pudo leer la tabla.")).mockResolvedValue(resultado(tabla));
      montar({ consultarTabla });
      fireEvent.click(screen.getByRole("tab", { name: tabla }));
      expect((await screen.findByRole("alert")).textContent).toContain("No se pudo leer la tabla.");
      fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
      expect(await screen.findByLabelText("Consulta SQL")).toBeTruthy();
      expect(consultarTabla).toHaveBeenCalledTimes(2);
    });
  }

  it("vuelve a consultar al cambiar de pestaña y deja sessions intacta", async () => {
    const consultarTabla = vi.fn(async (actual: NombreTablaAdk) => resultado(actual));
    montar({ consultarTabla });
    fireEvent.click(screen.getByRole("tab", { name: "events" }));
    await screen.findByLabelText("Consulta SQL");
    fireEvent.click(screen.getByRole("tab", { name: "app_states" }));
    await waitFor(() => expect(consultarTabla).toHaveBeenLastCalledWith("app_states"));
    fireEvent.click(screen.getByRole("tab", { name: "sessions" }));
    expect(await screen.findByText("Todavía no hay sesiones guardadas.")).toBeTruthy();
    expect(consultarTabla).toHaveBeenCalledTimes(2);
  });
});

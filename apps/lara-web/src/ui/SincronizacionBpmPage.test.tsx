// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { BpmSyncPort } from "../application/ports/BpmSyncPort";
import type { ResultadoDryRunBpm } from "../domain/SincronizacionBpm";
import { SincronizacionBpmPage } from "./SincronizacionBpmPage";

const resultado: ResultadoDryRunBpm = {
  crear: 2,
  actualizar: 1,
  sinCambios: 1,
  huerfanas: 1,
  filas: [
    { usuario: "usuario-prueba-a", accion: "crear", detalle: "Grupo de ejemplo" },
    { usuario: "usuario-prueba-b", accion: "crear", detalle: "Grupo de prueba" },
    { usuario: "usuario-prueba-c", accion: "actualizar", detalle: "Cambio de grupo" },
    { usuario: "usuario-prueba-d", accion: "sin-cambios", detalle: "—" },
    { usuario: "usuario-prueba-e", accion: "huerfana", detalle: "Revisar a mano" },
  ],
};

function montar(ejecutarDryRun = vi.fn(async () => resultado)) {
  const bpm: BpmSyncPort = { ejecutarDryRun };
  return { ...render(<SincronizacionBpmPage bpm={bpm} />), ejecutarDryRun };
}

afterEach(cleanup);

describe("SincronizacionBpmPage", () => {
  it("espera a que la persona solicite la simulación", () => {
    const { ejecutarDryRun } = montar();

    expect(screen.getByText("Ejecuta el dry-run para revisar los cambios que se simularían. No se modifica ninguna cuenta.")).toBeTruthy();
    expect(screen.getByText("Dry-run")).toBeTruthy();
    expect(ejecutarDryRun).not.toHaveBeenCalled();
  });

  it("muestra el aviso y esqueletos mientras espera el resultado", () => {
    const ejecutarDryRun = vi.fn(() => new Promise<ResultadoDryRunBpm>(() => {}));
    montar(ejecutarDryRun);

    fireEvent.click(screen.getByRole("button", { name: "Ejecutar dry-run" }));

    expect(screen.getByRole("status").textContent).toBe("Preparando la simulación BPM.");
    expect(screen.getByRole("region", { name: "Resultado de la simulación" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Ejecutando…" }).hasAttribute("disabled")).toBe(true);
  });

  it("muestra los cuatro conteos y las acciones por usuario al completar", async () => {
    montar();

    fireEvent.click(screen.getByRole("button", { name: "Ejecutar dry-run" }));

    const resumen = await screen.findByRole("region", { name: "Resumen de cambios simulados" });
    expect(resumen.textContent).toContain("Crear2Actualizar1Sin cambios1Huérfanas1");
    expect(screen.getByRole("table", { name: "Acciones previstas por usuario en la simulación BPM" })).toBeTruthy();
    expect(screen.getByText("usuario-prueba-a")).toBeTruthy();
    expect(screen.getByText("huérfana")).toBeTruthy();
    expect(screen.getByText(/Las cuentas huérfanas no se borran solas\./)).toBeTruthy();
  });

  it("muestra el estado vacío cuando la simulación no contiene filas", async () => {
    montar(vi.fn(async () => ({ ...resultado, crear: 0, actualizar: 0, sinCambios: 0, huerfanas: 0, filas: [] })));
    fireEvent.click(screen.getByRole("button", { name: "Ejecutar dry-run" }));

    expect(await screen.findByText("No se encontraron cambios para mostrar en esta simulación.")).toBeTruthy();
  });

  it("permite reintentar después de un error", async () => {
    const ejecutarDryRun = vi.fn<() => Promise<ResultadoDryRunBpm>>()
      .mockRejectedValueOnce(new Error("fallo de ejemplo"))
      .mockResolvedValueOnce(resultado);
    montar(ejecutarDryRun);

    fireEvent.click(screen.getByRole("button", { name: "Ejecutar dry-run" }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    await waitFor(() => expect(ejecutarDryRun).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole("table")).toBeTruthy();
  });
});

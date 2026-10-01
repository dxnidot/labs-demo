// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ResumenCategoriaFinanciera } from "../domain/MovimientoFinanciero";
import { FinanzasCharts } from "./FinanzasCharts";

vi.mock("recharts", async (importOriginal) => {
  const recharts = await importOriginal<typeof import("recharts")>();
  const React = await import("react");

  return {
    ...recharts,
    ResponsiveContainer: ({
      children,
    }: {
      children: React.ReactElement<{ width?: number; height?: number }>;
    }) => React.cloneElement(children, { width: 640, height: 240 }),
  };
});

afterEach(cleanup);

describe("FinanzasCharts", () => {
  it("renderiza barras reales separadas por gasto/ingreso y MXN/USD", () => {
    const resumenFake: ResumenCategoriaFinanciera[] = [
      { categoria: "Gasto MXN fake", tipo: "GASTO", moneda: "MXN", total: 1250 },
      { categoria: "Gasto USD fake", tipo: "GASTO", moneda: "USD", total: 32 },
      { categoria: "Ingreso MXN fake", tipo: "INGRESO", moneda: "MXN", total: 24000 },
      { categoria: "Ingreso USD fake", tipo: "INGRESO", moneda: "USD", total: 80 },
    ];

    const { container } = render(
      <>
        <FinanzasCharts resumen={resumenFake} tipo="GASTO" />
        <FinanzasCharts resumen={resumenFake} tipo="INGRESO" />
      </>,
    );

    const nombresGraficas = [
      "Gastos · MXN",
      "Gastos · USD",
      "Ingresos · MXN",
      "Ingresos · USD",
    ];

    for (const nombre of nombresGraficas) {
      const grafica = screen.getByRole("region", { name: nombre });
      const categoria = nombre.startsWith("Gastos")
        ? nombre.endsWith("MXN")
          ? "Gasto MXN fake"
          : "Gasto USD fake"
        : nombre.endsWith("MXN")
          ? "Ingreso MXN fake"
          : "Ingreso USD fake";
      const lista = within(grafica).getByRole("list", {
        name: nombre.startsWith("Gastos")
          ? `Importes de gastos por categoría en ${nombre.endsWith("MXN") ? "MXN" : "USD"}`
          : `Importes de ingresos por categoría en ${nombre.endsWith("MXN") ? "MXN" : "USD"}`,
      });

      expect(within(lista).getByText(categoria)).toBeTruthy();
      expect(grafica.querySelectorAll(".recharts-bar-rectangle")).toHaveLength(1);
    }

    expect(container.querySelectorAll("svg.recharts-surface")).toHaveLength(4);
  });
});

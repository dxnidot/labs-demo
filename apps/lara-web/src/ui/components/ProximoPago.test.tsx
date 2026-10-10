// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { Tarjeta } from "../../domain/Tarjeta";
import { ProximoPago } from "./ProximoPago";

const tarjeta: Tarjeta = {
  id: "t1",
  alias: "Tarjeta A",
  ultimos4: "1234",
  diaCorte: 15,
  diaPago: 5,
  permiteLiquidarMsiAnticipado: false,
  activa: true,
};

afterEach(cleanup);

describe("ProximoPago", () => {
  it("muestra alias, ••••, fecha con día de la semana y en cuántos días", () => {
    render(
      <ProximoPago
        accion={<button type="button">Ver calendario</button>}
        evento={{ fecha: "2026-10-05", tipo: "PAGO", alias: "Tarjeta A" }}
        hoy="2026-09-30"
        tarjeta={tarjeta}
      />,
    );

    const bloque = screen.getByRole("region", { name: "Próximo pago" });
    expect(within(bloque).getByText("Tarjeta A")).toBeTruthy();
    expect(within(bloque).getByText("••••1234")).toBeTruthy();
    expect(within(bloque).getByText("lunes 5 oct · en 5 días")).toBeTruthy();
    expect(within(bloque).getByRole("button", { name: "Ver calendario" })).toBeTruthy();
  });

  it("dice hoy y mañana cuando corresponde", () => {
    const { rerender } = render(
      <ProximoPago evento={{ fecha: "2026-10-05", tipo: "PAGO", alias: "Tarjeta A" }} hoy="2026-10-05" />,
    );
    expect(screen.getByText(/· hoy$/)).toBeTruthy();

    rerender(<ProximoPago evento={{ fecha: "2026-10-05", tipo: "PAGO", alias: "Tarjeta A" }} hoy="2026-10-04" />);
    expect(screen.getByText(/· mañana$/)).toBeTruthy();
  });

  it("sin evento dice que no hay pagos próximos y no muestra ••••", () => {
    render(<ProximoPago hoy="2026-09-30" />);

    expect(screen.getByText("Sin pagos próximos")).toBeTruthy();
    expect(screen.getByText("No hay pagos en los próximos 30 días.")).toBeTruthy();
    expect(screen.queryByText(/••••/)).toBeNull();
  });

  it("usa solo tokens: bloque highlight con su tinta", () => {
    render(<ProximoPago hoy="2026-09-30" />);

    const bloque = screen.getByRole("region", { name: "Próximo pago" });
    expect(bloque.className).toContain("bg-highlight");
    expect(bloque.className).toContain("text-highlight-ink");
  });
});

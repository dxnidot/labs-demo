import { describe, expect, it } from "vitest";
import {
  diasDelPeriodo,
  diasEntre,
  etiquetaPeriodo,
  fechaLarga,
  moverPeriodo,
  textoActualizado,
  textoEnDias,
} from "./finanzasFormato";

describe("periodo", () => {
  it("etiqueta el periodo con el mes en mayúscula y el año", () => {
    expect(etiquetaPeriodo("2026-09")).toBe("Septiembre 2026");
    expect(etiquetaPeriodo("2027-01")).toBe("Enero 2027");
  });

  it("se mueve por meses cruzando el año", () => {
    expect(moverPeriodo("2026-09", -1)).toBe("2026-08");
    expect(moverPeriodo("2026-01", -1)).toBe("2025-12");
    expect(moverPeriodo("2026-12", 1)).toBe("2027-01");
    expect(moverPeriodo("2026-10", 0)).toBe("2026-10");
  });

  it("cuenta los días del periodo, también en febrero bisiesto", () => {
    expect(diasDelPeriodo("2026-10")).toBe(31);
    expect(diasDelPeriodo("2026-02")).toBe(28);
    expect(diasDelPeriodo("2028-02")).toBe(29);
  });
});

describe("días y textos", () => {
  it("calcula los días entre fechas, también entre meses", () => {
    expect(diasEntre("2026-09-30", "2026-10-05")).toBe(5);
    expect(diasEntre("2026-10-05", "2026-10-05")).toBe(0);
    expect(diasEntre("2026-10-05", "2026-10-01")).toBe(-4);
  });

  it("dice hoy, mañana o en N días", () => {
    expect(textoEnDias(0)).toBe("hoy");
    expect(textoEnDias(1)).toBe("mañana");
    expect(textoEnDias(5)).toBe("en 5 días");
  });

  it("formatea la fecha larga", () => {
    expect(fechaLarga("2026-10-05")).toBe("5 de octubre");
  });

  it("dice cuánto hace que se actualizó", () => {
    expect(textoActualizado(null)).toBe("Actualizando…");
    expect(textoActualizado(0)).toBe("Actualizado hace menos de 1 min");
    expect(textoActualizado(2)).toBe("Actualizado hace 2 min");
    expect(textoActualizado(59)).toBe("Actualizado hace 59 min");
    expect(textoActualizado(125)).toBe("Actualizado hace 2 h");
  });
});

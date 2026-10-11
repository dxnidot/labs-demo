import { describe, expect, it } from "vitest";
import { tituloDeRuta } from "./tituloDocumento";

describe("tituloDeRuta", () => {
  it.each([
    ["/chat", "Chat · Lara"],
    ["/estado", "Estado del lab · Lara"],
    ["/base-de-datos", "Base de datos · Lara"],
    ["/gastos-fijos", "Gastos fijos · Lara"],
    ["/finanzas/resumen", "Finanzas · Resumen · Lara"],
    ["/finanzas/tarjetas", "Finanzas · Tarjetas y pagos · Lara"],
    ["/ruta-desconocida", "Lara"],
  ])("%s -> %s", (ruta, titulo) => {
    expect(tituloDeRuta(ruta)).toBe(titulo);
  });
});

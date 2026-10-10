// MOCK: opciones de menú ficticias.
import type { MenuPort } from "../../application/ports/MenuPort";
import type { MenuOpcion } from "../../domain/MenuOpcion";

/**
 * Cumple MenuPort con opciones de ejemplo para el usuario ficticio.
 * @author Daniel Tovar
 * @since 2026-10-10
 */
export class MockMenuAdapter implements MenuPort {
  obtenerMenu(): Promise<MenuOpcion[]> {
    return Promise.resolve([
      { clave: "movimientos", titulo: "Consultar movimientos", ruta: "/finanzas/gastos", acciones: ["consultar"] },
      { clave: "tarjetas", titulo: "Ver tarjetas y pagos", ruta: "/finanzas/tarjetas", acciones: ["consultar", "activar"] },
      { clave: "calendario", titulo: "Calendario de pagos", ruta: "/finanzas/tarjetas", acciones: ["consultar"] },
    ]);
  }
}

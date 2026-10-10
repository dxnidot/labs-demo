import type { MenuPort } from "../ports/MenuPort";
import type { MenuOpcion } from "../../domain/MenuOpcion";

/**
 * Obtiene las opciones de menú que el backend autorizó para el usuario.
 * @author Daniel
 * @since 2026-09-30
 */
export class ObtenerMenu {
  constructor(private readonly menu: MenuPort) {}

  ejecutar(): Promise<MenuOpcion[]> {
    return this.menu.obtenerMenu();
  }
}

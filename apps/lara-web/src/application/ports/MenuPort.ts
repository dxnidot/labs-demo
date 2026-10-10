import type { MenuOpcion } from "../../domain/MenuOpcion";

/**
 * Define la consulta del menú filtrado por roles.
 * @author Daniel
 * @since 2026-09-30
 */
export interface MenuPort {
  obtenerMenu(): Promise<MenuOpcion[]>;
}

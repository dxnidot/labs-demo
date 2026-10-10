import type { MenuOpcion } from "./MenuOpcion";

/** Menú de un usuario de prueba del realm, para comparar roles entre usuarios (MenuPort solo expone el actual). */
export interface UsuarioMenu {
  username: string;
  roles: string[];
  opciones: MenuOpcion[];
}

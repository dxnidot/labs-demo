import type { MenuOpcion } from "./MenuOpcion";

export interface UsuarioMenu {
  username: string;
  roles: string[];
  opciones: MenuOpcion[];
}

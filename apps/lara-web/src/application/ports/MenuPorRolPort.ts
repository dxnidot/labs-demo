import type { UsuarioMenu } from "../../domain/UsuarioMenu";

/** Menú de varios usuarios de prueba a la vez; MenuPort.obtenerMenu solo devuelve el usuario autenticado. */
export interface MenuPorRolPort {
  listarPorUsuario(): Promise<UsuarioMenu[]>;
}

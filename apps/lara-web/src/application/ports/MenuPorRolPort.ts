import type { UsuarioMenu } from "../../domain/UsuarioMenu";

/** Consulta las opciones visibles de cada usuario ficticio de prueba.
 * @author Daniel Tovar
 * @since 2026-10-10
 */
export interface MenuPorRolPort {
  listarPorUsuario(): Promise<UsuarioMenu[]>;
}

import type { UsuarioRealm } from "../../domain/UsuarioRealm";

/** Consulta usuarios del realm visibles para la pantalla de Lara.
 * @author Daniel Tovar
 * @since 2026-10-10
 */
export interface UsuariosRealmPort {
  listarUsuarios(): Promise<UsuarioRealm[]>;
}

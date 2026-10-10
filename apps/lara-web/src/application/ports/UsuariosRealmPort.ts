import type { UsuarioRealm } from "../../domain/UsuarioRealm";

/** Lista de usuarios del realm `lab`, solo lectura (los cambios se hacen en Keycloak). */
export interface UsuariosRealmPort {
  listarUsuarios(): Promise<UsuarioRealm[]>;
}

// MOCK: usuarios y roles de ejemplo; no consulta Keycloak ni persiste información.
import type { UsuariosRealmPort } from "../../application/ports/UsuariosRealmPort";
import type { UsuarioRealm } from "../../domain/UsuarioRealm";

const usuariosIniciales: readonly UsuarioRealm[] = [
  { username: "ejemplo-lima", grupo: "ejecutivos", roles: ["ver-menu"] },
  { username: "ejemplo-nube", grupo: "supervisores", roles: ["ver-menu", "autorizar"] },
  { username: "prueba-cobalto", grupo: "operaciones", roles: ["ver_agentes"] },
  { username: "demo-orbita", grupo: null, roles: ["ver-menu", "ver_identidad"] },
];

/** Devuelve usuarios de realm ficticios para la vista de consulta.
 * @author Daniel Tovar
 * @since 2026-10-10
 */
export class MockUsuariosRealmAdapter implements UsuariosRealmPort {
  listarUsuarios(): Promise<UsuarioRealm[]> {
    return Promise.resolve(usuariosIniciales.map((usuario) => ({ ...usuario, roles: [...usuario.roles] })));
  }
}

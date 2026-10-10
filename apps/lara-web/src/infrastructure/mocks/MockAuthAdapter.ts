// MOCK: autenticación ficticia para trabajar sin Keycloak; no hay sesión real ni token.
import type { AuthPort } from "../../application/ports/AuthPort";
import type { Usuario } from "../../domain/Usuario";

/**
 * Cumple AuthPort con un usuario ficticio que ve todas las secciones; no contacta a ningún servicio.
 * @author Daniel Tovar
 * @since 2026-10-10
 */
export class MockAuthAdapter implements AuthPort {
  private readonly usuario: Usuario = {
    id: "usuario-mock",
    username: "demo",
    roles: ["ver_agentes", "ver_identidad", "ver-finanzas", "llm_basic"],
    kcMenuRoles: ["ver-menu"],
  };

  init(): Promise<Usuario | null> {
    return Promise.resolve(this.usuario);
  }

  login(): Promise<void> {
    return Promise.resolve();
  }

  usuarioActual(): Usuario | null {
    return this.usuario;
  }

  token(): string | null {
    return null;
  }

  claimsToken(): Record<string, unknown> | null {
    return {
      iss: "mock",
      sub: this.usuario.id,
      preferred_username: this.usuario.username,
      aviso: "Claims ficticios del modo mock; no hay token.",
    };
  }

  updateToken(): Promise<string> {
    return Promise.resolve("sin-token-mock");
  }

  /** Sin servidor de sesión que cerrar: recarga la app, que vuelve a entrar como el usuario ficticio. */
  logout(): Promise<void> {
    window.location.reload();
    return Promise.resolve();
  }
}

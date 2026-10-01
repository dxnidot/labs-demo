import type { AuthPort } from "../ports/AuthPort";
import type { Usuario } from "../../domain/Usuario";

/**
 * Comprueba la sesión existente y permite iniciar el login con Keycloak.
 * @author Daniel
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-09-30 Devuelve null sin sesión y añade el inicio del login.
 */
export class IniciarSesion {
  constructor(private readonly auth: AuthPort) {}

  ejecutar(): Promise<Usuario | null> {
    return this.auth.init();
  }

  login(): Promise<void> {
    return this.auth.login();
  }
}

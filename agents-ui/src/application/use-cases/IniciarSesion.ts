import type { AuthPort } from "../ports/AuthPort";
import type { Usuario } from "../../domain/Usuario";

/**
 * Inicia la autenticación y devuelve el usuario autenticado.
 * @author Daniel
 * @since 2026-09-30
 */
export class IniciarSesion {
  constructor(private readonly auth: AuthPort) {}

  ejecutar(): Promise<Usuario> {
    return this.auth.init();
  }
}

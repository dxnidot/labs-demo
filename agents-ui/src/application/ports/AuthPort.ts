import type { Usuario } from "../../domain/Usuario";

/**
 * Define la autenticación requerida por la aplicación.
 * @author Daniel
 * @since 2026-09-30
 */
export interface AuthPort {
  init(): Promise<Usuario>;
  usuarioActual(): Usuario | null;
  token(): string | null;
  updateToken(): Promise<string>;
  logout(): Promise<void>;
}

import type { Usuario } from "../../domain/Usuario";

/**
 * Define la autenticación requerida por la aplicación.
 * @author Daniel
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-09-30 init devuelve null sin sesión; añade login y claims del token.
 */
export interface AuthPort {
  /** Comprueba la sesión sin redirigir; null significa que no hay sesión. */
  init(): Promise<Usuario | null>;
  /** Redirige a Keycloak (PKCE S256 configurado en init). */
  login(): Promise<void>;
  usuarioActual(): Usuario | null;
  token(): string | null;
  /** Claims decodificados del access token en memoria; nunca el token crudo. */
  claimsToken(): Record<string, unknown> | null;
  updateToken(): Promise<string>;
  logout(): Promise<void>;
}

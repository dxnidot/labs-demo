import type { AuthPort } from "../ports/AuthPort";

/**
 * Devuelve los claims decodificados del access token en memoria.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
export class ObtenerClaimsToken {
  constructor(private readonly auth: AuthPort) {}

  ejecutar(): Record<string, unknown> | null {
    return this.auth.claimsToken();
  }
}

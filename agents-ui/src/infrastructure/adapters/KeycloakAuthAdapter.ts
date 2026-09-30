import Keycloak from "keycloak-js";
import type { AuthPort } from "../../application/ports/AuthPort";
import type { Usuario } from "../../domain/Usuario";

const keycloak = new Keycloak({
  url: "http://localhost:8080",
  realm: "lab",
  clientId: "agents-ui",
});
let initPromise: Promise<Usuario> | undefined;

/**
 * Adapta el cliente JavaScript de Keycloak al puerto de autenticación.
 * @author Daniel
 * @since 2026-09-30
 */
export class KeycloakAuthAdapter implements AuthPort {
  init(): Promise<Usuario> {
    initPromise ??= keycloak
      .init({
        onLoad: "login-required",
        pkceMethod: "S256",
        checkLoginIframe: false,
      })
      .then((authenticated) => {
        if (!authenticated) {
          throw new Error("Keycloak no autenticó al usuario.");
        }
        return this.leerUsuario();
      });
    return initPromise;
  }

  usuarioActual(): Usuario | null {
    if (!keycloak.subject || !keycloak.tokenParsed?.preferred_username) {
      return null;
    }

    return this.leerUsuario();
  }

  token(): string | null {
    return keycloak.token ?? null;
  }

  async updateToken(): Promise<string> {
    try {
      await keycloak.updateToken(30);
    } catch {
      await keycloak.login();
      throw new Error("Falló la renovación del token; se inició nuevamente el login.");
    }

    if (!keycloak.token) {
      throw new Error("Keycloak no devolvió un token de acceso.");
    }
    return keycloak.token;
  }

  logout(): Promise<void> {
    return keycloak.logout({ redirectUri: window.location.origin });
  }

  private leerUsuario(): Usuario {
    const id = keycloak.subject;
    const username = keycloak.tokenParsed?.preferred_username;
    if (!id || !username) {
      throw new Error("El token de Keycloak no contiene sub y preferred_username.");
    }

    const realmRoles = keycloak.realmAccess?.roles ?? [];
    const clientRoles = Object.values(keycloak.resourceAccess ?? {}).flatMap(
      (access) => access.roles ?? [],
    );

    return {
      id,
      username,
      roles: [...new Set([...realmRoles, ...clientRoles])],
    };
  }
}

export const keycloakAuthAdapter = new KeycloakAuthAdapter();

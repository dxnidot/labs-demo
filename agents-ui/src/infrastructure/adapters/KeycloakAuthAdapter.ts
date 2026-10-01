import Keycloak from "keycloak-js";
import type { AuthPort } from "../../application/ports/AuthPort";
import type { Usuario } from "../../domain/Usuario";

const keycloak = new Keycloak({
  url: "http://localhost:8080",
  realm: "lab",
  clientId: "agents-ui",
});
let initPromise: Promise<Usuario | null> | undefined;

/**
 * Adapta el cliente JavaScript de Keycloak al puerto de autenticación.
 * @author Daniel
 * @since 2026-09-30
 * @modified Daniel Tovar 2026-09-30 Usa check-sso con SSO silencioso, añade login y claims del token.
 */
export class KeycloakAuthAdapter implements AuthPort {
  init(): Promise<Usuario | null> {
    initPromise ??= keycloak
      .init({
        onLoad: "check-sso",
        pkceMethod: "S256",
        silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
        checkLoginIframe: false,
      })
      .then((authenticated) => (authenticated ? this.leerUsuario() : null));
    return initPromise;
  }

  login(): Promise<void> {
    return keycloak.login();
  }

  claimsToken(): Record<string, unknown> | null {
    return keycloak.tokenParsed ? { ...keycloak.tokenParsed } : null;
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
    const chatApiRoles = keycloak.resourceAccess?.["chat-api"]?.roles ?? [];

    return {
      id,
      username,
      roles: [...new Set([...realmRoles, ...clientRoles])],
      chatApiRoles: [...new Set(chatApiRoles)],
    };
  }
}

export const keycloakAuthAdapter = new KeycloakAuthAdapter();

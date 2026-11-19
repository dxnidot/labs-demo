/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "true" activa los adaptadores mock con datos ficticios (ver .env.example). */
  readonly VITE_USE_MOCKS?: string;
  /** URL base de Keycloak; por defecto http://localhost:8080. */
  readonly VITE_KEYCLOAK_URL?: string;
  /** Realm de Keycloak; por defecto "lab". */
  readonly VITE_KEYCLOAK_REALM?: string;
  /** Client público de Lara en Keycloak; por defecto "lara-web". */
  readonly VITE_KEYCLOAK_CLIENT_ID?: string;
}

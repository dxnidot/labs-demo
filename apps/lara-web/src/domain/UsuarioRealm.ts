/** Usuario del realm `lab` tal como lo expondría la Admin REST API de Keycloak (solo lectura). */
export interface UsuarioRealm {
  username: string;
  grupo: string | null;
  roles: string[];
}

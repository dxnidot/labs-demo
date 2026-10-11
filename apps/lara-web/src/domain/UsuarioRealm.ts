/** Usuario ficticio del realm y sus roles para el cliente de Lara. */
export interface UsuarioRealm {
  username: string;
  grupo: string | null;
  roles: string[];
}

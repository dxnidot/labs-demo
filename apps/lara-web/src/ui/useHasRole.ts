import type { Usuario } from "../domain/Usuario";

/**
 * Indica si el usuario tiene al menos uno de los roles pedidos (semántica OR, coincidencia exacta).
 * @author Daniel Tovar
 * @since 2026-10-01
 */
export function useHasRole(usuario: Usuario, roles: string[]): boolean {
  return usuario.roles.some((rol) => roles.includes(rol));
}

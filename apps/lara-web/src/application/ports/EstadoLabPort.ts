import type { ClaveServicio, Disponibilidad } from "../../domain/ServicioLab";

/**
 * Define la comprobación de salud de un servicio del lab.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
export interface EstadoLabPort {
  comprobar(clave: ClaveServicio): Promise<Disponibilidad>;
}

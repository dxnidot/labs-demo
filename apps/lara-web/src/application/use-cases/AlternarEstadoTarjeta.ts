import type { Tarjeta } from "../../domain/Tarjeta";
import type { FinanzasPort } from "../ports/FinanzasPort";

/**
 * Cambia únicamente el estado activo de una tarjeta existente.
 * @author Daniel
 * @since 2026-09-30
 */
export class AlternarEstadoTarjeta {
  constructor(private readonly finanzas: FinanzasPort) {}

  ejecutar(tarjeta: Tarjeta): Promise<Tarjeta> {
    return this.finanzas.actualizarTarjeta({
      ...tarjeta,
      activa: !tarjeta.activa,
    });
  }
}

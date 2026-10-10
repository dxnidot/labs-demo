import type { EstadoLabPort } from "../ports/EstadoLabPort";
import { serviciosLab, type EstadoServicio } from "../../domain/ServicioLab";

/**
 * Comprueba en paralelo todos los servicios del lab.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
export class ComprobarServicios {
  constructor(private readonly estadoLab: EstadoLabPort) {}

  ejecutar(): Promise<EstadoServicio[]> {
    return Promise.all(
      serviciosLab.map(async (servicio) => ({
        servicio,
        disponibilidad: await this.estadoLab.comprobar(servicio.clave).catch(() => "sin-respuesta" as const),
      })),
    );
  }
}

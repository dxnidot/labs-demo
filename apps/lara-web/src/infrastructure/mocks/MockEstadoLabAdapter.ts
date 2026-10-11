// MOCK: salud de servicios ficticia; no hace peticiones de red.
import type { EstadoLabPort } from "../../application/ports/EstadoLabPort";
import type { ClaveServicio, Disponibilidad } from "../../domain/ServicioLab";

/**
 * Cumple EstadoLabPort: todos "arriba" salvo kc-demo, para ver los dos estados en la pantalla.
 * @author Daniel Tovar
 * @since 2026-10-10
 */
export class MockEstadoLabAdapter implements EstadoLabPort {
  comprobar(clave: ClaveServicio): Promise<Disponibilidad> {
    return Promise.resolve(clave === "kc-demo" ? "sin-respuesta" : "arriba");
  }
}

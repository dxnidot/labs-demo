import type { EstadoLabPort } from "../../application/ports/EstadoLabPort";
import type { ClaveServicio, Disponibilidad } from "../../domain/ServicioLab";

/**
 * Rutas same-origin (proxy de Vite) que cada servicio atiende sin autenticación.
 * Un servicio protegido que contesta 401 también cuenta como arriba; el proxy de Vite
 * contesta 5xx cuando el destino está caído, por lo que 5xx cuenta como sin respuesta.
 */
const rutasSalud: Record<ClaveServicio, string> = {
  keycloak: "/salud/keycloak",
  adk: "/adk/list-apps",
  "kc-demo": "/api/menu",
  finanzas: "/api/finanzas/tarjetas",
};

/**
 * Comprueba la salud de los servicios locales con un timeout corto.
 * @author Daniel Tovar
 * @since 2026-09-30
 */
export class HttpEstadoLabAdapter implements EstadoLabPort {
  constructor(private readonly timeoutMs = 3000) {}

  async comprobar(clave: ClaveServicio): Promise<Disponibilidad> {
    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), this.timeoutMs);
    try {
      const respuesta = await fetch(rutasSalud[clave], {
        cache: "no-store",
        signal: controlador.signal,
      });
      return respuesta.status < 500 ? "arriba" : "sin-respuesta";
    } catch {
      return "sin-respuesta";
    } finally {
      clearTimeout(temporizador);
    }
  }
}

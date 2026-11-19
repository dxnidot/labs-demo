import type { AuthPort } from "../../application/ports/AuthPort";

/**
 * Envía peticiones autenticadas a las APIs locales de Lara.
 * @author Daniel
 * @since 2026-09-30
 * @modified Daniel 2026-09-30 Generaliza los errores para distintos servicios.
 * @modified Daniel 2026-09-30 Añade envío autenticado de multipart sin JSON.
 * @modified Daniel Tovar 2026-11-19 Añade solicitarRespuesta (token, cabeceras y error HTTP) para reutilizarlo en el adaptador ADK.
 */
export class ApiHttpClient {
  constructor(private readonly auth: AuthPort) {}

  /**
   * Hace la petición con el token vigente y lanza si la respuesta no es 2xx.
   * Las cabeceras Accept y Content-Type que ya traiga `init` se respetan (p. ej. SSE).
   */
  async solicitarRespuesta(
    path: string,
    init: RequestInit = {},
    mensajeError: (status: number) => string = (status) => `La API respondió HTTP ${status}.`,
  ): Promise<Response> {
    const token = await this.auth.updateToken();
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }
    // Con FormData el navegador fija el multipart y su boundary: no se fuerza JSON.
    if (init.body !== undefined && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(path, { ...init, headers });
    if (!response.ok) {
      throw new Error(mensajeError(response.status));
    }
    return response;
  }

  async solicitar(path: string, init: RequestInit = {}): Promise<unknown> {
    const response = await this.solicitarRespuesta(path, init);
    return response.json() as Promise<unknown>;
  }

  async solicitarArchivo(path: string, archivo: File): Promise<unknown> {
    const formData = new FormData();
    formData.append("archivo", archivo);
    const response = await this.solicitarRespuesta(path, { method: "POST", body: formData });
    return response.json() as Promise<unknown>;
  }
}

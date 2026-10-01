import type { AuthPort } from "../../application/ports/AuthPort";

/**
 * Envía peticiones autenticadas a las APIs locales de Lara.
 * @author Daniel
 * @since 2026-09-30
 * @modified Daniel 2026-09-30 Generaliza los errores para distintos servicios.
 * @modified Daniel 2026-09-30 Añade envío autenticado de multipart sin JSON.
 */
export class ApiHttpClient {
  constructor(private readonly auth: AuthPort) {}

  async solicitar(path: string, init: RequestInit = {}): Promise<unknown> {
    const token = await this.auth.updateToken();
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    headers.set("Accept", "application/json");
    if (init.body !== undefined) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(path, { ...init, headers });
    if (!response.ok) {
      throw new Error(`La API respondió HTTP ${response.status}.`);
    }
    return response.json() as Promise<unknown>;
  }

  async solicitarArchivo(path: string, archivo: File): Promise<unknown> {
    const token = await this.auth.updateToken();
    const formData = new FormData();
    formData.append("archivo", archivo);
    const response = await fetch(path, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: formData,
    });
    if (!response.ok) {
      throw new Error(`La API respondió HTTP ${response.status}.`);
    }
    return response.json() as Promise<unknown>;
  }
}

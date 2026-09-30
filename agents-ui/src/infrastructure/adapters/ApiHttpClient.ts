import type { AuthPort } from "../../application/ports/AuthPort";

/**
 * Envía peticiones autenticadas a la API de kc-demo.
 * @author Daniel
 * @since 2026-09-30
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
      throw new Error(`La API de kc-demo respondió HTTP ${response.status}.`);
    }
    return response.json() as Promise<unknown>;
  }
}

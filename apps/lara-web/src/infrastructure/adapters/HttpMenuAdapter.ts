import type { MenuPort } from "../../application/ports/MenuPort";
import type { MenuOpcion } from "../../domain/MenuOpcion";
import { ApiHttpClient } from "./ApiHttpClient";

/**
 * Adapta el endpoint autenticado del menú de kc-demo.
 * @author Daniel
 * @since 2026-09-30
 */
export class HttpMenuAdapter implements MenuPort {
  constructor(private readonly http: ApiHttpClient) {}

  async obtenerMenu(): Promise<MenuOpcion[]> {
    const response = await this.http.solicitar("/api/menu");
    if (!Array.isArray(response) || !response.every(esMenuOpcion)) {
      throw new Error("La API de kc-demo devolvió un menú inválido.");
    }
    return response;
  }
}

function esMenuOpcion(value: unknown): value is MenuOpcion {
  return (
    typeof value === "object" &&
    value !== null &&
    "clave" in value &&
    typeof value.clave === "string" &&
    "titulo" in value &&
    typeof value.titulo === "string" &&
    "ruta" in value &&
    typeof value.ruta === "string" &&
    "acciones" in value &&
    Array.isArray(value.acciones) &&
    value.acciones.every((accion: unknown) => typeof accion === "string")
  );
}

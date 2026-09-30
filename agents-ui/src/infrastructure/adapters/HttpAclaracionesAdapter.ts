import type { AclaracionesPort } from "../../application/ports/AclaracionesPort";
import type { Aclaracion } from "../../domain/Aclaracion";
import type { ResultadoAprobacion } from "../../domain/ResultadoAprobacion";
import { ApiHttpClient } from "./ApiHttpClient";

/**
 * Adapta los endpoints de consulta y aprobación de kc-demo.
 * @author Daniel
 * @since 2026-09-30
 */
export class HttpAclaracionesAdapter implements AclaracionesPort {
  constructor(private readonly http: ApiHttpClient) {}

  async obtenerAclaraciones(): Promise<Aclaracion[]> {
    const response = await this.http.solicitar("/api/aclaraciones");
    if (!Array.isArray(response) || !response.every(esAclaracion)) {
      throw new Error("La API de kc-demo devolvió una lista de aclaraciones inválida.");
    }
    return response;
  }

  async aprobarAclaracion(id: number): Promise<ResultadoAprobacion> {
    const response = await this.http.solicitar(
      `/api/aclaraciones/${encodeURIComponent(id)}/aprobar`,
      { method: "POST" },
    );
    if (!esResultadoAprobacion(response)) {
      throw new Error("La API de kc-demo devolvió un resultado de aprobación inválido.");
    }
    return response;
  }
}

function esAclaracion(value: unknown): value is Aclaracion {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "number" &&
    "descripcion" in value &&
    typeof value.descripcion === "string" &&
    "estatus" in value &&
    typeof value.estatus === "string"
  );
}

function esResultadoAprobacion(value: unknown): value is ResultadoAprobacion {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "number" &&
    "estatus" in value &&
    typeof value.estatus === "string"
  );
}

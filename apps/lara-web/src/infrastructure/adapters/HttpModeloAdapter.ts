import type { ModeloPort } from "../../application/ports/ModeloPort";
import type { Modelo } from "../../domain/Modelo";
import { ApiHttpClient } from "./ApiHttpClient";

/**
 * Adapta el endpoint autenticado de modelos de LLM del orquestador.
 * @author Daniel Tovar
 * @since 2026-10-01
 */
export class HttpModeloAdapter implements ModeloPort {
  constructor(private readonly http: ApiHttpClient) {}

  async listarDisponibles(): Promise<Modelo[]> {
    const response = await this.http.solicitar("/api/llm/available-models");
    if (!Array.isArray(response) || !response.every(esModeloCrudo)) {
      throw new Error("La API devolvió una lista de modelos inválida.");
    }
    return response.map((modelo) => ({
      id: modelo.id,
      nombre: modelo.name,
      tier: modelo.tier,
    }));
  }
}

interface ModeloCrudo {
  id: string;
  name: string;
  tier: "basic" | "advanced";
}

function esModeloCrudo(value: unknown): value is ModeloCrudo {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "name" in value &&
    typeof value.name === "string" &&
    "tier" in value &&
    (value.tier === "basic" || value.tier === "advanced")
  );
}

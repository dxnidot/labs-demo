// MOCK: catálogo de modelos ficticio.
import type { ModeloPort } from "../../application/ports/ModeloPort";
import type { Modelo } from "../../domain/Modelo";

/**
 * Cumple ModeloPort con dos modelos de ejemplo (uno básico y uno avanzado).
 * @author Daniel Tovar
 * @since 2026-10-10
 */
export class MockModeloAdapter implements ModeloPort {
  listarDisponibles(): Promise<Modelo[]> {
    return Promise.resolve([
      { id: "mock/modelo-basico", nombre: "modelo-basico (mock)", tier: "basic" },
      { id: "mock/modelo-avanzado", nombre: "modelo-avanzado (mock)", tier: "advanced" },
    ]);
  }
}
